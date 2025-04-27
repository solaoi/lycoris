use super::sqlite::Sqlite;

use reqwest::{
    header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE},
    Client,
};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};
use tokio::runtime::Runtime;

pub struct Agent {
    runtime: Runtime,
    app_handle: AppHandle,
    note_id: u64,
    agent: String,
    sqlite: Sqlite,
    token: String,
}

impl Agent {
    pub fn new(app_handle: AppHandle, note_id: u64, agent: String) -> Self {
        let runtime = Runtime::new().expect("Failed to create Tokio runtime");
        let sqlite = Sqlite::new();
        let token = sqlite.select_whisper_token().unwrap();

        Agent {
            runtime,
            app_handle,
            sqlite,
            note_id,
            agent,
            token,
        }
    }

    async fn request(
        content: String,
        token: String,
        agent: &super::sqlite::Agent,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let url = "https://api.openai.com/v1/chat/completions";
        let temperature = 0.2;

        let client = Client::new();

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", token))?,
        );
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        let mut messages: Vec<Value> = Vec::new();
        let system_prompt = format!(
        "あなたは『{}』という名前の優秀なアシスタントです。**最終出力は必ず次の JSON だけにしてください。**

```json
{{
\"result\": \"プロンプトの実行結果をここに挿入\"
}}
```",
        agent.name
    );

        messages.push(json!({
            "role": "developer",
            "content": system_prompt
        }));

        messages.push(json!({
            "role": "user",
            "content": agent.role_prompt
        }));

        messages.push(json!({
            "role": "user",
            "content": content
        }));

        // for debugging
        // println!("messages: {:?}", messages);

        let response_format = json!({
            "type": "json_schema",
            "json_schema": {
                "name": "generate_result",
                "description": "プロンプトの実行結果を格納します。",
                "strict": true,
                "schema": {
                    "type": "object",
                    "properties": {
                        "result": {
                            "type": "string",
                            "description": "プロンプトの実行結果。"
                        }
                    },
                    "required": ["result"],
                    "additionalProperties": false,
                }
            }
        });

        let post_body = json!({
            "model": "gpt-4.1",
            "temperature": temperature,
            "messages": messages,
            "response_format": response_format
        });

        let response = client
            .post(url)
            .headers(headers)
            .json(&post_body)
            .send()
            .await?;

        let status = response.status();
        let json_response: Value = response.json().await?;

        let response_text = if status == 200 {
            let content_str = json_response["choices"][0]["message"]["content"]
                .as_str()
                .unwrap_or("choices[0].message.content field not found");

            if let Ok(content_json) = serde_json::from_str::<Value>(content_str) {
                content_json["result"]
                    .as_str()
                    .unwrap_or("result field not found")
                    .to_string()
            } else {
                "Failed to parse content as JSON".to_string()
            }
        } else {
            json_response.to_string()
        };

        Ok(response_text)
    }

    async fn request_with_workspace(
        content: String,
        token: String,
        agent: &super::sqlite::Agent,
        workspace_content: String,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let url = "https://api.openai.com/v1/chat/completions";
        let temperature = 0.2;

        let client = Client::new();

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", token))?,
        );
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        let mut messages: Vec<Value> = Vec::new();
        let system_prompt = format!(
            "あなたは『{}』という名前の優秀なアシスタントです。

あなたは「ワークスペース」というノートを保持しており、新しい指示や実行結果があればワークスペースを更新・上書きしてください。
なお、ワークスペースはあなたの返答で完全に上書きされるので、必要な情報は残すようにしてください。

あなたがユーザーに返す **最終的な出力** は必ず以下のJSON形式「だけ」にしてください。
「ワークスペースを更新します」等のメッセージは不要です。あくまでワークスペースの内容を返してください。

```json
{{
\"workspace\": \"あなたが保持しているワークスペースの最新内容\"
}}
```",
            agent.name
        );

        messages.push(json!({
            "role": "developer",
            "content": system_prompt
        }));

        let assistant_prompt = format!(
            "こちらが現在のワークスペースの内容です。

{}",
            workspace_content
        );

        messages.push(json!({
            "role": "assistant",
            "content": assistant_prompt
        }));

        messages.push(json!({
            "role": "user",
            "content": agent.role_prompt
        }));

        messages.push(json!({
            "role": "user",
            "content": content
        }));

        // for debugging
        // println!("messages: {:?}", messages);

        let response_format = json!({
            "type": "json_schema",
            "json_schema": {
                "name": "update_workspace",
                "description": "ワークスペースの内容を更新します。",
                "strict": true,
                "schema": {
                    "type": "object",
                    "properties": {
                        "workspace": {
                            "type": "string",
                            "description": "ワークスペースの内容。"
                        }
                    },
                    "required": ["workspace"],
                    "additionalProperties": false,
                }
            }
        });

        let post_body = json!({
            "model": "gpt-4.1",
            "temperature": temperature,
            "messages": messages,
            "response_format": response_format
        });

        let response = client
            .post(url)
            .headers(headers)
            .json(&post_body)
            .send()
            .await?;

        let status = response.status();
        let json_response: Value = response.json().await?;

        let response_text = if status == 200 {
            let content_str = json_response["choices"][0]["message"]["content"]
                .as_str()
                .unwrap_or("choices[0].message.content field not found");

            if let Ok(content_json) = serde_json::from_str::<Value>(content_str) {
                content_json["workspace"]
                    .as_str()
                    .unwrap_or("result field not found")
                    .to_string()
            } else {
                "Failed to parse content as JSON".to_string()
            }
        } else {
            json_response.to_string()
        };

        Ok(response_text)
    }

    fn execute(&mut self) -> Result<(), rusqlite::Error> {
        let agent = self.sqlite.select_agent(self.agent.clone()).unwrap();
        let whisper_speech_with_no_agent = self.sqlite.select_whisper_with_no_agent(self.note_id);

        whisper_speech_with_no_agent.and_then(|speech| {
            self.runtime.block_on(async {
                let content = speech.content.clone();
                let token = self.token.clone();

                if agent.mode == 0 {
                    match Self::request(content.clone(), token.clone(), &agent).await {
                        Ok(response) => {
                            let inserted = self.sqlite.insert_agent_speech(
                                speech.id,
                                agent.id,
                                response,
                                self.note_id,
                            );

                            if let Ok(agent_speech) = inserted {
                                self.app_handle
                                    .clone()
                                    .emit_all("agentHandled", agent_speech)
                                    .unwrap();
                            }
                        }
                        Err(_) => {
                            println!("api is temporally failed, so skipping...");
                        }
                    }
                }

                if agent.has_workspace == 1 {
                    let workspace = self
                        .sqlite
                        .select_agent_workspace(self.note_id, agent.id)
                        .unwrap();
                    let workspace_content = workspace
                        .clone()
                        .is_some()
                        .then(|| workspace.clone().unwrap().content)
                        .unwrap_or("現在のワークスペースは空です。".to_string());
                    let workspace_id: Option<u16> = workspace.map(|w| w.id);
                    match Self::request_with_workspace(content, token, &agent, workspace_content)
                        .await
                    {
                        Ok(response) => {
                            let upserted = self.sqlite.upsert_agent_workspace(
                                workspace_id,
                                response,
                                agent.id,
                                self.note_id,
                            );

                            if let Ok(agent_workspace) = upserted {
                                println!("agent_workspace: {:?}", agent_workspace);
                                self.app_handle
                                    .clone()
                                    .emit_all("agentWorkspaceHandled", agent_workspace)
                                    .unwrap();
                            }
                        }
                        Err(_) => {
                            println!("api is temporally failed, so skipping...");
                        }
                    }
                }
                let _ = self.sqlite.update_speech_agent_done(speech.id);

                Ok(())
            })
        })
    }

    pub fn start(&mut self) {
        while self.execute().is_ok() {
            println!("Processed one item. Checking if there's next...");
        }
        println!("No more items or encountered an error. Stop loop.");
    }
}
