use reqwest::{
    header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE},
    Client,
};
use serde_json::{json, Value};

use super::sqlite::Sqlite;

pub struct OnlineLLMClient {
    model: String,
    token: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ApprovedResult {
    pub is_approved: bool,
    pub reason: String,
}

impl OnlineLLMClient {
    pub fn new() -> Self {
        let sqlite = Sqlite::new();
        let token = sqlite.select_whisper_token().unwrap();
        let model = "gpt-4o-mini".to_string();

        Self { model, token }
    }

    pub async fn check_approve_cmds(
        &self,
        note_id: u64,
        speech_id: u16,
        cmds: Vec<(String, String, String, String, String)>,
    ) -> Result<ApprovedResult, String> {
        let url = "https://api.openai.com/v1/chat/completions";
        let temperature = 0;

        let client = Client::new();

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", self.token)).map_err(|e| e.to_string())?,
        );
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        let sqlite = Sqlite::new();
        let contents = sqlite.select_contents_by(note_id, speech_id).unwrap();
        let arr: Vec<_> = contents.iter().rev().take(5).collect();

        let mut prompt_history = String::new();
        let mut current_type = String::new();
        let mut current_content = String::new();

        for content in arr.iter().rev() {
            match content.speech_type.as_str() {
                "action" => {
                    if !current_content.is_empty() {
                        prompt_history
                            .push_str(&format!(":::{}\n{}\n:::\n", current_type, current_content));
                        current_content.clear();
                    }
                    if content.action_type == "suggest" {
                        prompt_history.push_str(&format!(
                                ":::assistant\n[query]\n次の発言者のための3つの発話サジェストとその理由を生成してください。\n[answer] {}\n{}\n:::\n",
                                content.content, content.content_2
                            ));
                    } else {
                        prompt_history.push_str(&format!(
                            ":::assistant\n[query]\n{}\n[answer]\n{}\n:::\n",
                            content.content, content.content_2
                        ));
                    }
                }
                "speech" | _ => {
                    let speech_type = if content.speech_type == "speech" {
                        "transcription"
                    } else if content.speech_type == "memo" {
                        "note"
                    } else {
                        // "screenshot"
                        "note"
                    };
                    if speech_type != current_type && !current_content.is_empty() {
                        prompt_history
                            .push_str(&format!(":::{}\n{}\n:::\n", current_type, current_content));
                        current_content.clear();
                    }
                    current_type = speech_type.to_string();
                    current_content.push_str(&content.content);
                    current_content.push('\n');
                }
            }
        }

        if !current_content.is_empty() {
            prompt_history.push_str(&format!(":::{}\n{}\n:::\n", current_type, current_content));
        }

        let mut messages: Vec<Value> = Vec::new();

        let system_role = if matches!(
            self.model.as_str(),
            "o1" | "o3-mini-low" | "o3-mini" | "o3-mini-high" | "gpt-4.5-preview"
        ) {
            "developer"
        } else {
            "system"
        };
        let system_content = format!(
            r#"あなたは与えられた履歴やコマンド群をもとに「コマンドを実行してもよいかどうか」を決定するAIアシスタントです。
コマンドはユーザーが事前に登録したMCPサーバーを経由して実行されることに留意してください。
以下の点に注意して判断し、結果を厳密なJSON形式で返答してください。

1. **ファイルの読み取り (read)**  
    - 読み込み対象がシステムの機密ファイルや個人情報、秘密情報（例: 環境変数やクレデンシャルが含まれるファイル）ではないか。  
    - 万が一、秘密情報にアクセスする可能性がある場合は「実行不可」と判断する。

2. **ファイルの書き込み (write)**  
    - 実行結果として、重要な設定ファイルや既存データを上書きしようとしていないか。  
    - 必要性・影響範囲を確認し、破壊的変更（データ消失・上書き）が想定される場合は「実行不可」と判断する。

5. **その他考慮事項**  
    - `read` が意図せず大量のファイルやログを読み取る操作になっていないか。  
    - `write` で生成されるファイルがシステムに不要な大量ファイルや不適切なパスへ書き込みを行わないか。  
    - ユーザが意図した利用範囲を履歴情報から判断して、実行してもよいかどうかを判断する。

これらの基準にもとづいて、コマンドの実行可否を下記形式のJSONで返答してください。

```json
{{
  "is_approved": (true または false),
  "reason": "却下する簡潔な理由。却下しない場合は空文字を返す。"
}}
```

【履歴情報（時間（昇）順）】
{}"#,
            prompt_history
        );
        messages.push(json!({
            "role": system_role,
            "content": system_content
        }));

        let user_content = format!(
            "以下のMCPサーバに対するコマンド群を実行しても問題ありませんか？\n{}",
            cmds.iter()
                .map(|(tool_name, method, args, description, instruction)| {
                    if instruction.is_empty() {
                        format!(
                            "mcp_server: {}, method: {}, args: {}, description: {}",
                            tool_name, method, args, description
                        )
                    } else {
                        format!(
                            "mcp_server: {}, method: {}, args: {}, description: {}, instruction: {}",
                            tool_name, method, args, description, instruction
                        )
                    }
                })
                .collect::<Vec<_>>()
                .join("\n")
        );
        messages.push(json!({
            "role": "user",
            "content": user_content
        }));

        let response_format = json!({
            "type": "json_schema",
            "json_schema": {
                "name": "check_approve_cmds",
                "description": "提供された履歴・コマンドをもとに実行可否を判断し、厳密なJSONを返す。却下する場合は理由をreasonに入れる。",
                "strict": true,
                "schema": {
                    "type": "object",
                    "properties": {
                        "is_approved": {
                            "type": "boolean",
                            "description": "最終的にコマンドを実行して良いかどうか"
                        },
                        "reason": {
                            "type": "string",
                            "description": "却下する簡潔な理由。却下しない場合は空文字を返す。"
                        }
                    },
                    "required": ["is_approved", "reason"],
                    "additionalProperties": false
                }
            }
        });

        let post_body = if self.model == "o1" {
            json!({
              "model": self.model,
              "messages": messages,
              "response_format": response_format
            })
        } else if self.model == "o3-mini-low"
            || self.model == "o3-mini"
            || self.model == "o3-mini-high"
        {
            json!({
              "model": "o3-mini",
              "messages": messages,
              "response_format": response_format,
              "reasoning_effort": if self.model == "o3-mini-low" {"low"} else if self.model == "o3-mini" {"medium"} else {"high"}
            })
        } else {
            json!({
              "model": self.model,
              "temperature": temperature,
              "messages": messages,
              "response_format": response_format
            })
        };

        let response = client
            .post(url)
            .headers(headers)
            .json(&post_body)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        let status = response.status();
        let json_response: Value = response.json().await.map_err(|e| e.to_string())?;

        let response_text = if status == 200 {
            json_response["choices"][0]["message"]["content"]
                .as_str()
                .unwrap_or("choices[0].message.content field not found")
                .to_string()
        } else {
            json_response.to_string()
        };

        println!("response_text: {}", response_text);

        let parsed: Value = serde_json::from_str(&response_text)
            .map_err(|e| format!("Failed to parse response_text as JSON: {}", e))?;

        let is_approved = if parsed["error"].is_null() {
            match parsed["is_approved"].as_bool() {
                Some(val) => val,
                None => false,
            }
        } else {
            false
        };

        let reason = if parsed["error"].is_null() {
            match parsed["reason"].as_str() {
                Some(val) => val.to_string(),
                None => "".to_string(),
            }
        } else {
            parsed["error"]
                .as_str()
                .unwrap_or("error field not found")
                .to_string()
        };

        Ok(ApprovedResult {
            is_approved,
            reason,
        })
    }
}
