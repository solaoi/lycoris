use super::sqlite::Sqlite;
use mcp_sdk::{
    client::ClientBuilder,
    protocol::RequestOptions,
    transport::{ClientStdioTransport, Transport},
    types::{Implementation, ServerCapabilities},
};
use serde::Deserialize;
use serde_json::{json, Value};
use std::{collections::HashMap, sync::Arc, time::Duration};
use tauri::AppHandle;
use tokio::sync::Mutex;
use which::which;

#[derive(Debug, Clone, Deserialize)]
pub struct ToolConnectTestRequest {
    pub command: String,
    pub args: Option<Vec<String>>,
    pub env: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ToolConfig {
    pub command: String,
    #[serde(default)]
    pub args: Vec<String>,
    #[serde(default)]
    pub env: HashMap<String, String>,
    pub auto_approve: Option<u16>,
    pub instruction: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Config {
    #[serde(rename = "mcpServers")]
    pub mcp_servers: HashMap<String, ToolConfig>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Tool {
    pub name: String,
    pub auto_approve: u16,
    pub instruction: String,
}

#[derive(Clone)]
pub struct MCPHost {
    app_handle: AppHandle,
    clients: Arc<Mutex<HashMap<String, mcp_sdk::client::Client<ClientStdioTransport>>>>,
    tool_configs: HashMap<String, ToolConfig>,
}

impl MCPHost {
    fn new(app_handle: AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let sqlite = Sqlite::new();
        let tools = sqlite.select_all_tools()?;
        println!(
            "Creating MCPHost with tools: {:?}",
            tools.keys().collect::<Vec<_>>()
        );

        Ok(Self {
            app_handle,
            clients: Arc::new(Mutex::new(HashMap::new())),
            tool_configs: tools,
        })
    }

    pub async fn connect(
        &self,
    ) -> Result<HashMap<String, ServerCapabilities>, Box<dyn std::error::Error>> {
        let client_info = Implementation {
            name: self.app_handle.package_info().name.to_string(),
            version: self.app_handle.package_info().version.to_string(),
        };

        let mut clients = self.clients.lock().await;
        let mut capabilities = HashMap::new();

        // tool_configsをクローンして所有権の問題を解決
        let tool_configs = self.tool_configs.clone();

        // クローンしたtool_configsに対してイテレート
        for (name, config) in tool_configs {
            println!("Connecting to {}", name);

            let transport = match ClientStdioTransport::new(
                &config.command,
                &config.args.iter().map(AsRef::as_ref).collect::<Vec<_>>(),
                &config.env,
            ) {
                Ok(t) => t,
                Err(e) => {
                    eprintln!("Failed to create transport for {}: {}", name, e);
                    continue;
                }
            };

            if let Err(e) = transport.open() {
                eprintln!("Failed to open transport for {}: {}", name, e);
                continue;
            }

            let client = ClientBuilder::new(transport.clone()).build();
            let client_clone = client.clone();
            let name_clone = name.clone();
            tokio::spawn(async move {
                if let Err(e) = client_clone.start().await {
                    eprintln!("Client {} failed: {}", name_clone, e);
                }
            });

            match client.initialize(client_info.clone()).await {
                Ok(res) => {
                    capabilities.insert(name.clone(), res.capabilities);
                    clients.insert(name, client);
                }
                Err(e) => {
                    eprintln!("Failed to initialize client for {}: {}", name, e);
                    continue;
                }
            }
        }

        Ok(capabilities)
    }

    async fn fetch_all_tools_for_client(
        client: &mcp_sdk::client::Client<ClientStdioTransport>,
    ) -> Result<Vec<Value>, Box<dyn std::error::Error + Send + Sync>> {
        let mut all_tools = Vec::new();
        let mut cursor = None;

        loop {
            let response = client
                .request(
                    "tools/list",
                    cursor.map(|c| json!({ "cursor": c })),
                    RequestOptions::default().timeout(Duration::from_secs(5)),
                )
                .await?;

            if let Some(tools) = response.get("tools").and_then(|t| t.as_array()) {
                all_tools.extend(tools.clone());
            }

            match response.get("nextCursor").and_then(|c| c.as_str()) {
                Some(next_cursor) if !next_cursor.is_empty() => {
                    cursor = Some(next_cursor.to_string())
                }
                _ => break,
            }
        }

        Ok(all_tools)
    }

    pub async fn get_all_tool_features(
        &self,
    ) -> Result<HashMap<String, Vec<Value>>, Box<dyn std::error::Error>> {
        let clients = self.clients.lock().await;
        let mut results = HashMap::new();
        for (name, client) in clients.iter() {
            match Self::fetch_all_tools_for_client(client).await {
                Ok(tools) => {
                    results.insert(name.clone(), tools);
                }
                Err(e) => {
                    eprintln!("Error fetching tools for client {}: {}", name, e);
                    return Err(e);
                }
            }
        }

        Ok(results)
    }

    pub async fn get_tool_features(
        &self,
        tool_name: &str,
    ) -> Result<Vec<Value>, Box<dyn std::error::Error + Send + Sync>> {
        let clients = self.clients.lock().await;
        println!(
            "Available clients: {:?}",
            clients.keys().collect::<Vec<_>>()
        );
        let client = clients
            .get(tool_name)
            .ok_or_else(|| format!("Tool '{}' not found", tool_name))?;

        Self::fetch_all_tools_for_client(client).await
    }

    pub async fn execute_tool_feature(
        &self,
        tool_name: &str,
        method: &str,
        params: Value,
    ) -> Result<Value, Box<dyn std::error::Error>> {
        let clients = self.clients.lock().await;
        let client = clients
            .get(tool_name)
            .ok_or_else(|| format!("Tool '{}' not found", tool_name))?;

        let response = client
            .request(
                "tools/call",
                Some(json!({
                    "name": method,
                    "arguments": params,
                })),
                RequestOptions::default().timeout(Duration::from_secs(5)),
            )
            .await?;

        Ok(response)
    }
}

pub async fn initialize_mcp_host(
    app_handle: AppHandle,
) -> Result<MCPHost, Box<dyn std::error::Error>> {
    let host = MCPHost::new(app_handle)?;
    host.connect().await?;
    Ok(host)
}

pub async fn test_tool_connection(
    tool_connect_test_request: &ToolConnectTestRequest,
) -> Result<bool, Box<dyn std::error::Error>> {
    let client_info = Implementation {
        name: "mcp_connection_test".to_string(),
        version: "1.0.0".to_string(),
    };

    if let Err(e) = which(&tool_connect_test_request.command) {
        eprintln!(
            "Program not found: {} - {}",
            &tool_connect_test_request.command, e
        );
        return Ok(false);
    }

    let args: Vec<&str> = match &tool_connect_test_request.args {
        Some(vec) => vec.iter().map(|s| s.as_str()).collect(),
        None => Vec::new(),
    };
    let env: HashMap<String, String> = match &tool_connect_test_request.env {
        Some(map) => map
            .iter()
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect(),
        None => HashMap::new(),
    };
    let transport = match ClientStdioTransport::new(&tool_connect_test_request.command, &args, &env)
    {
        Ok(t) => t,
        Err(e) => {
            eprintln!(
                "Failed to create transport: command={}, args={:?}, error={}",
                tool_connect_test_request.command, args, e
            );
            return Ok(false);
        }
    };

    if let Err(e) = transport.open() {
        eprintln!(
            "Failed to open transport: command={}, error={}",
            tool_connect_test_request.command, e
        );
        return Ok(false);
    }

    let client = ClientBuilder::new(transport.clone()).build();
    let client_for_listen = client.clone();
    tokio::spawn(async move {
        let _ = client_for_listen.start().await;
    });

    let result = client.initialize(client_info).await?;
    println!("ServerCapabilities: {:?}", result.capabilities);
    drop(client);
    transport.close().expect("Failed to close transport");

    Ok(true)
}

pub async fn add_mcp_config(config: Config) -> Result<(), std::string::String> {
    for (name, tool) in config.mcp_servers {
        let args_json = serde_json::to_string(&tool.args).map_err(|e| e.to_string())?;

        let env_json = serde_json::to_string(&tool.env).map_err(|e| e.to_string())?;
        let sqlite = Sqlite::new();
        sqlite
            .insert_tool(name.replace("_", "-"), tool.command, args_json, env_json, tool.auto_approve, tool.instruction)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn delete_mcp_config(tool_names: Vec<String>) -> Result<(), std::string::String> {
    for tool_name in tool_names {
        let sqlite = Sqlite::new();
        sqlite.delete_tool(tool_name).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn get_mcp_tools() -> Result<Vec<Tool>, std::string::String> {
    let sqlite = Sqlite::new();
    let tools = sqlite
        .select_all_tools()
        .expect("Failed to select all tools");

    Ok(tools
        .into_iter()
        .map(|(name, tool)| Tool {
            name,
            auto_approve: tool.auto_approve.unwrap_or(0),
            instruction: tool.instruction.unwrap_or("".to_string()),
        })
        .collect())
}
