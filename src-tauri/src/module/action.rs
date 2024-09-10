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
        for content in contents.iter() {
            if content.speech_type == "action" {
                messages.push(json!({
                    "role": "user",
                    "content": content.content.clone()
                }));
                messages.push(json!({
                    "role": "assistant",
                    "content": content.content_2.clone()
                }));
            } else {
                messages.push(json!({
                    "role": "user",
                    "content": content.content.clone()
                }));
            }
        }
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
