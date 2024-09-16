use std::sync::Mutex;

use reqwest::{
    header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE},
    Client,
};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};

use super::sqlite::{Content, Sqlite};

pub struct Action {
    app_handle: AppHandle,
    sqlite: Sqlite,
    note_id: u64,
    model: String,
    token: String,
}

impl Action {
    pub fn new(app_handle: AppHandle, note_id: u64) -> Self {
        let sqlite = Sqlite::new();
        let token = sqlite.select_whisper_token().unwrap();
        let model = sqlite
            .select_ai_model()
            .unwrap_or_else(|_| "gpt-4o-mini".to_string());
        Self {
            app_handle,
            sqlite,
            note_id,
            model,
            token,
        }
    }

    #[tokio::main]
    async fn request_gpt(
        model: String,
        question: String,
        contents: Vec<Content>,
        token: String,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let url = "https://api.openai.com/v1/chat/completions";
        let temperature = 0;

        let client = Client::new();

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", token))?,
        );
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        let mut messages: Vec<Value> = Vec::new();
        let mut prompt = "あなたは高度な文字起こし解析AIアシスタントです。
提供される情報を統合し、ユーザーの最終的な質問に対して包括的で正確な回答を提供することが、あなたの役割です。
以下の手順に従って処理を行ってください：

1. 情報の分析：
  a) 文字起こし (:::transcription で囲まれた部分)：会話の主要な内容と流れを把握します。
  b) メモ (:::note で囲まれた部分)：文脈や補足情報として扱います。
  c) 過去のAIとのQ&A (:::assistant で囲まれた部分)：関連する追加情報として考慮します。
2. 情報の優先順位付け：
  - 文字起こしの内容を最も重要視します。
  - メモと過去のQ&Aは補足情報として扱いますが、関連性が高い場合は積極的に活用します。
3. 回答の構造化：
  a) 要約：主要なポイントを簡潔にまとめます（3-5文程度）。
  b) 詳細分析：重要なトピックについて掘り下げて説明します。
  c) 追加の洞察：メモやQ&Aから得られた関連情報を提供します。
  d) 結論：全体を総括し、ユーザーの質問に直接答えます。
4. エラー処理：
  - 情報が不完全や矛盾している場合は、その旨を明確に述べます。
  - 可能な限り、利用可能な情報に基づいて回答し、推測が含まれる場合はその旨を明示します。
5. 回答の調整：
  - ユーザーの質問の種類（要約、分析、意見など）に応じて、回答の焦点と深さを調整します。
  - 必要に応じて、追加の質問や明確化を求めることを提案します。

以下に提供される情報を上記の手順に従って分析し、次のユーザーの質問に答えてください：

".to_string();
        let mut current_type = String::new();
        let mut current_content = String::new();

        for content in contents.iter() {
            match content.speech_type.as_str() {
                "action" => {
                    if !current_content.is_empty() {
                        prompt
                            .push_str(&format!(":::{}\n{}\n:::\n", current_type, current_content));
                        current_content.clear();
                    }
                    prompt.push_str(&format!(
                        ":::assistant\n[query]\n{}\n[answer]\n{}\n:::\n",
                        content.content, content.content_2
                    ));
                }
                "speech" | _ => {
                    let speech_type = if content.speech_type == "speech" {
                        "transcription"
                    } else if content.speech_type == "memo" {
                        "note"
                    } else { // "screenshot"
                        "note"
                    };
                    if speech_type != current_type && !current_content.is_empty() {
                        prompt
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
            prompt.push_str(&format!(":::{}\n{}\n:::\n", current_type, current_content));
        }
        prompt.push_str("\n回答の際は、上記の手順に従い、情報を適切に統合し、構造化された形で提供してください。次のユーザーの質問に直接答え、必要に応じて追加の洞察や説明を加えてください。");

        messages.push(json!({
            "role": "system",
            "content": prompt
        }));
        messages.push(json!({
            "role": "user",
            "content": question
        }));

        // for debugging
        // println!("messages: {:?}", messages);

        let post_body = json!({
          "model": model,
          "temperature": temperature,
          "messages": messages
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
            json_response["choices"][0]["message"]["content"]
                .as_str()
                .unwrap_or("choices[0].message.content field not found")
                .to_string()
        } else {
            json_response.to_string()
        };

        Ok(response_text)
    }

    pub fn execute(&mut self) {
        if self.token == "" {
            println!("whisper token is empty, so skipping...");
            return;
        }
        let mut is_executing = IS_EXECUTING.lock().unwrap();
        *is_executing = true;

        while let Ok(action) = self.sqlite.select_first_unexecuted_action(self.note_id) {
            match self
                .sqlite
                .select_has_no_permission_of_execute_action(self.note_id, action.id)
            {
                Ok(permissions) => {
                    if permissions.is_empty() || permissions.iter().any(|p| p.model == "whisper") {
                        match self.sqlite.select_contents_by(self.note_id, action.id) {
                            Ok(contents) => {
                                match Self::request_gpt(
                                    self.model.clone(),
                                    action.content,
                                    contents,
                                    self.token.clone(),
                                ) {
                                    Ok(answer) => {
                                        match self
                                            .sqlite
                                            .update_action_content_2(action.id, answer.clone())
                                        {
                                            Ok(result) => {
                                                let _ = self
                                                    .app_handle
                                                    .emit_all("actionExecuted", result);
                                            }
                                            Err(e) => {
                                                println!(
                                                    "Error updating action content_2: {:?}",
                                                    e
                                                );
                                                break;
                                            }
                                        }
                                    }
                                    Err(_) => {
                                        println!("gpt api is temporarily failed, so skipping...");
                                        break;
                                    }
                                }
                            }
                            Err(e) => {
                                println!("Error selecting contents: {:?}", e);
                                break;
                            }
                        }
                    } else {
                        println!("has_no_permission_of_execute_action is false, so skipping...");
                        break;
                    }
                }
                Err(e) => {
                    println!("Error checking permissions: {:?}", e);
                    break;
                }
            }
        }

        *is_executing = false;
    }
}

pub static SINGLETON_INSTANCE: Mutex<Option<Action>> = Mutex::new(None);
pub static IS_EXECUTING: Mutex<bool> = Mutex::new(false);

pub fn initialize_action(app_handle: AppHandle, note_id: u64) -> bool {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    let is_executing = IS_EXECUTING.lock().unwrap();
    if singleton.is_none() {
        *singleton = Some(Action::new(app_handle, note_id));
        true
    } else if *is_executing {
        false
    } else {
        true
    }
}

pub fn drop_action() {
    let is_executing = IS_EXECUTING.lock().unwrap();
    if !*is_executing {
        let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
        *singleton = None;
    }
}
