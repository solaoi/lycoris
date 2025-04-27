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
        agent_speeches: Vec<super::sqlite::AgentHistory>,
        speeches: Vec<super::sqlite::Speech>,
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
        let mut system_prompt = format!(
            "あなたは『{}』という名前の優秀なアシスタントです。
ユーザーから指定がない限りは、口頭での会話となるよう、長くても300文字以内で、Markdown形式を用いない、通常のテキストで返答してください。

**最終出力は必ず次の JSON だけにしてください。**

```json
{{
\"result\": \"プロンプトの実行結果をここに挿入\"
}}
```",
        agent.name
    );

        if !workspace_content.is_empty() {
            system_prompt += &format!(
            "
あなたは自身の記憶として、下記ワークスペースの内容を参照しています。
なお更新等は別のアシスタントが行いますので、あなたは会話に注力してください。

{}",
                workspace_content
            );
        }

        messages.push(json!({
            "role": "developer",
            "content": system_prompt
        }));

        messages.push(json!({
            "role": "user",
            "content": agent.role_prompt
        }));

        if agent.ref_recent_conversation == 1 {
            if speeches.len() > 0 {
                let user_additional_prompt = format!(
                    "こちらは、過去のユーザーの発言です。

{}",
                    speeches
                        .iter()
                        .map(|speech| format!("- [unixtime: {}]: {}", speech.created_at_unixtime, speech.content.clone()))
                        .collect::<Vec<String>>()
                        .join("\n")
                );

                messages.push(json!({
                    "role": "assistant",
                    "content": user_additional_prompt
                }));
            }
            if agent_speeches.len() > 0 {
                let assistant_additional_prompt = format!(
                    "こちらは、過去の『{}』アシスタントである、あなたの発言です。

{}",
                    agent.name,
                    agent_speeches
                        .iter()
                        .map(|speech| format!("- [unixtime: {}]: {}", speech.created_at_unixtime, speech.content.clone()))
                        .collect::<Vec<String>>()
                        .join("\n")
                );

                messages.push(json!({
                    "role": "assistant",
                    "content": assistant_additional_prompt
                }));
            }
        }

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
        agent_speeches: Vec<super::sqlite::AgentHistory>,
        speeches: Vec<super::sqlite::Speech>,
    ) -> Result<(String, bool), Box<dyn std::error::Error>> {
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
        let mut system_prompt = format!(
            "あなたは『{}』という名前の優秀なアシスタントです。

あなたは「ワークスペース」というノートを保持しており、新しい指示や実行結果があればワークスペースを更新・上書きしてください。
なお、ワークスペースはあなたの返答で完全に上書きされるので、必要な情報は残すようにしてください。

あなたがユーザーに返す **最終的な出力** は必ず以下のJSON形式「だけ」にしてください。
「ワークスペースを更新します」等のメッセージは不要です。あくまでワークスペースの内容を返してください。
なお、ワークスペースの更新が不要の場合は、should_update_workspaceをfalseとし、workspaceは空文字としてください。

```json
{{
\"should_update_workspace\": boolean,
\"workspace\": \"あなたが保持しているワークスペースの最新内容\"
}}
```",
            agent.name
        );

        if agent.ref_recent_conversation == 1 {
            system_prompt += "

なお、直近の会話履歴を参考のため添付することがありますが、あなたは会話内容に言及することなく、ワークスペースの更新に注力してください。"
        }

        messages.push(json!({
            "role": "developer",
            "content": system_prompt
        }));

        let assistant_prompt = format!(
            "こちらは、現在のワークスペースの内容です。

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

        if agent.ref_recent_conversation == 1 {
            if speeches.len() > 0 {
                let user_additional_prompt = format!(
                    "こちらは、過去のユーザーの発言です。

{}",
                    speeches
                        .iter()
                        .map(|speech| format!("- [unixtime: {}]: {}", speech.created_at_unixtime, speech.content.clone()))
                        .collect::<Vec<String>>()
                        .join("\n")
                );

                messages.push(json!({
                    "role": "assistant",
                    "content": user_additional_prompt
                }));
            }
            if agent_speeches.len() > 0 {
                let assistant_additional_prompt = format!(
                    "こちらは、過去の『{}』アシスタントである、あなたの発言です。

{}",
                    agent.name,
                    agent_speeches
                        .iter()
                        .map(|speech| format!("- [unixtime: {}]: {}", speech.created_at_unixtime, speech.content.clone()))
                        .collect::<Vec<String>>()
                        .join("\n")
                );

                messages.push(json!({
                    "role": "assistant",
                    "content": assistant_additional_prompt
                }));
            }
        }

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
                        "should_update_workspace": {
                            "type": "boolean",
                            "description": "ワークスペースの更新が不要の場合はfalse、更新が必要な場合はtrue"
                        },
                        "workspace": {
                            "type": "string",
                            "description": "ワークスペースの内容。"
                        }
                    },
                    "required": ["workspace", "should_update_workspace"],
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

        let res: (String, bool) = if status == 200 {
            let content_str = json_response["choices"][0]["message"]["content"]
                .as_str()
                .unwrap_or("choices[0].message.content field not found");

            if let Ok(content_json) = serde_json::from_str::<Value>(content_str) {
                let workspace = content_json["workspace"]
                    .as_str()
                    .unwrap_or("result field not found")
                    .to_string();
                let should_update_workspace = content_json["should_update_workspace"]
                    .as_bool()
                    .unwrap_or(false);
                (workspace, should_update_workspace)
            } else {
                ("Failed to parse content as JSON".to_string(), false)
            }
        } else {
            ("Failed to parse content as JSON".to_string(), false)
        };

        Ok(res)
    }

    fn execute(&mut self) -> Result<(), rusqlite::Error> {
        let agent = self.sqlite.select_agent(self.agent.clone()).unwrap();
        let whisper_speech_with_no_agent = self.sqlite.select_whisper_with_no_agent(self.note_id);

        whisper_speech_with_no_agent.and_then(|speech| {
            self.runtime.block_on(async {
                let content = speech.content.clone();
                let token = self.token.clone();
                let mut agent_speeches = Vec::new();
                let mut speeches = Vec::new();
                if agent.ref_recent_conversation == 1 {
                    let max_history_count = 7;
                    agent_speeches = self
                        .sqlite
                        .select_latest_agent_speeches(self.note_id, agent.id, max_history_count)
                        .unwrap_or(Vec::new());
                    speeches = self
                        .sqlite
                        .select_lateset_speeches(self.note_id, max_history_count)
                        .unwrap_or(Vec::new());
                }
                let mut workspace: Option<super::sqlite::AgentWorkspace> = None;
                let mut workspace_content = "".to_string();
                if agent.has_workspace == 1 {
                    workspace = self
                        .sqlite
                        .select_agent_workspace(self.note_id, agent.id)
                        .unwrap();
                    workspace_content = workspace
                        .clone()
                        .is_some()
                        .then(|| workspace.clone().unwrap().content)
                        .unwrap_or("現在のワークスペースは空です。".to_string());
                }
                if agent.mode == 0 {
                    match Self::request(
                        content.clone(),
                        token.clone(),
                        &agent,
                        agent_speeches.clone(),
                        speeches.clone(),
                        workspace_content.clone(),
                    )
                    .await
                    {
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
                    let workspace_id: Option<u16> = workspace.map(|w| w.id);

                    match Self::request_with_workspace(
                        content,
                        token,
                        &agent,
                        workspace_content,
                        agent_speeches,
                        speeches,
                    )
                    .await
                    {
                        Ok((response, should_update_workspace)) => {
                            if should_update_workspace {
                                let upserted = self.sqlite.upsert_agent_workspace(
                                    workspace_id,
                                    response,
                                    agent.id,
                                    self.note_id,
                                );

                                if let Ok(agent_workspace) = upserted {
                                    self.app_handle
                                        .clone()
                                        .emit_all("agentWorkspaceHandled", agent_workspace)
                                        .unwrap();
                                }
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
