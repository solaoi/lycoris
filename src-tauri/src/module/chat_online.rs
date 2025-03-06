use tokio::{fs::File, io::AsyncReadExt};

use super::sqlite::Sqlite;

use crossbeam_channel::Receiver;

use reqwest::{
    header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE},
    multipart, Client,
};
use serde_json::{json, Value};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, serde::Serialize)]
pub struct TraceCompletion {}

pub struct ChatOnline {
    app_handle: AppHandle,
    sqlite: Sqlite,
    speaker_language: String,
    note_id: u64,
    token: String,
}

impl ChatOnline {
    pub fn new(app_handle: AppHandle, speaker_language: String, note_id: u64) -> Self {
        let sqlite = Sqlite::new();
        let token = sqlite.select_whisper_token().unwrap();
        Self {
            app_handle,
            sqlite,
            speaker_language,
            note_id,
            token,
        }
    }

    pub fn start(&mut self, stop_convert_rx: Receiver<()>, use_no_vosk_queue_terminate_mode: bool) {
        while Self::convert(self).is_ok() {
            if use_no_vosk_queue_terminate_mode {
                let vosk_speech = self.sqlite.select_vosk(self.note_id);
                if vosk_speech.is_err() {
                    self.app_handle
                        .clone()
                        .emit_all("traceCompletion", TraceCompletion {})
                        .unwrap();
                    break;
                }
            }
            if stop_convert_rx.try_recv().is_ok() {
                let vosk_speech = self.sqlite.select_vosk(self.note_id);
                if vosk_speech.is_err() {
                    self.app_handle
                        .clone()
                        .emit_all("traceCompletion", TraceCompletion {})
                        .unwrap();
                } else {
                    self.app_handle
                        .clone()
                        .emit_all("traceUnCompletion", TraceCompletion {})
                        .unwrap();
                }
                break;
            }
        }
    }

    #[tokio::main]
    async fn request_whisper(
        speaker_language: String,
        file_path: String,
        token: String,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let url = "https://api.openai.com/v1/audio/transcriptions";

        let model = "whisper-1";

        let client = Client::new();

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", token))?,
        );
        let mut file = File::open(file_path).await?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).await?;

        let part_file = multipart::Part::bytes(buffer)
            .file_name("test.wav")
            .mime_str("audio/wav")?;

        let part_model = multipart::Part::text(model);
        let language = if speaker_language.starts_with("en-us")
            || speaker_language.starts_with("small-en-us")
        {
            "en"
        } else if speaker_language.starts_with("cn") || speaker_language.starts_with("small-cn") {
            "zh"
        } else if speaker_language.starts_with("small-ko") {
            "ko"
        } else if speaker_language.starts_with("fr") || speaker_language.starts_with("small-fr") {
            "fr"
        } else if speaker_language.starts_with("de") || speaker_language.starts_with("small-de") {
            "de"
        } else if speaker_language.starts_with("ru") || speaker_language.starts_with("small-ru") {
            "ru"
        } else if speaker_language.starts_with("es") || speaker_language.starts_with("small-es") {
            "es"
        } else if speaker_language.starts_with("small-pt") {
            "pt"
        } else if speaker_language.starts_with("small-tr") {
            "tr"
        } else if speaker_language.starts_with("vn") || speaker_language.starts_with("small-vn") {
            "vi"
        } else if speaker_language.starts_with("it") || speaker_language.starts_with("small-it") {
            "it"
        } else if speaker_language.starts_with("small-nl") {
            "nl"
        } else if speaker_language.starts_with("small-ca") {
            "ca"
        } else if speaker_language.starts_with("uk") || speaker_language.starts_with("small-uk") {
            "uk"
        } else if speaker_language.starts_with("small-sv") {
            "sv"
        } else if speaker_language.starts_with("hi") || speaker_language.starts_with("small-hi") {
            "hi"
        } else if speaker_language.starts_with("small-cs") {
            "cs"
        } else if speaker_language.starts_with("small-pl") {
            "pl"
        } else {
            "ja"
        };
        let part_language = multipart::Part::text(language);

        let form = multipart::Form::new()
            .part("file", part_file)
            .part("model", part_model)
            .part("language", part_language);

        let response = client
            .post(url)
            .headers(headers)
            .multipart(form)
            .send()
            .await?;

        let json_response: Value = response.json().await?;
        let response_text = json_response["text"]
            .as_str()
            .unwrap_or("text field not found");

        Ok(response_text.to_string())
    }

    #[tokio::main]
    async fn request_gpt(
        model: &str,
        question: &str,
        token: String,
        template: String,
        functions: &str,
        function_call: &str,
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

        let post_body = if !template.is_empty() {
            if model == "o1"
                || model == "o3-mini-low"
                || model == "o3-mini"
                || model == "o3-mini-high"
            {
                json!({
                  "model": model,
                  "messages": [{"role": "developer", "content": template},{"role": "user", "content": question}]
                })
            } else if model == "o1-mini" || model == "o1-preview" {
                json!({
                  "model": model,
                  "messages": [{"role": "assistant", "content": template},{"role": "user", "content": question}]
                })
            } else {
                if !functions.is_empty() {
                    let func: Value = serde_json::from_str(functions).unwrap();
                    if !function_call.is_empty() {
                        json!({
                        "model": model,
                        "temperature": temperature,
                        "messages": [{"role": "system", "content": template},{"role": "user", "content": question}],
                        "functions": func,
                        "function_call" : json!({"name": function_call})
                        })
                    } else {
                        json!({
                        "model": model,
                        "temperature": temperature,
                        "messages": [{"role": "system", "content": template},{"role": "user", "content": question}],
                        "functions": func,
                        "function_call" : "auto"
                        })
                    }
                } else {
                    json!({
                    "model": model,
                    "temperature": temperature,
                    "messages": [{"role": "system", "content": template},{"role": "user", "content": question}]
                    })
                }
            }
        } else {
            if model == "o1"
                || model == "o1-mini"
                || model == "o1-preview"
                || model == "o3-mini-low"
                || model == "o3-mini"
                || model == "o3-mini-high"
            {
                json!({
                  "model": model,
                  "messages": [{"role": "user", "content": question}]
                })
            } else {
                if !functions.is_empty() {
                    let func: Value = serde_json::from_str(functions).unwrap();
                    if !function_call.is_empty() {
                        json!({
                          "model": model,
                          "temperature": temperature,
                          "messages": [{"role": "user", "content": question}],
                          "functions": func,
                          "function_call" : json!({"name": function_call})
                        })
                    } else {
                        json!({
                          "model": model,
                          "temperature": temperature,
                          "messages": [{"role": "user", "content": question}],
                          "functions": func,
                          "function_call" : "auto"
                        })
                    }
                } else {
                    json!({
                      "model": model,
                      "temperature": temperature,
                      "messages": [{"role": "user", "content": question}]
                    })
                }
            }
        };

        let response = client
            .post(url)
            .headers(headers)
            .json(&post_body)
            .send()
            .await?;

        let status = response.status();
        let json_response: Value = response.json().await?;

        let response_text = if status == 200 {
            if !functions.is_empty()
                && model != "o1"
                && model != "o1-mini"
                && model != "o1-preview"
                && model != "o3-mini-low"
                && model != "o3-mini"
                && model != "o3-mini-high"
            {
                let name = serde_json::to_string(
                    &json_response["choices"][0]["message"]["function_call"]["name"],
                )
                .unwrap_or("choices[0].message.function_call.name field not found".to_string());
                let arguments = serde_json::to_string(
                    &json_response["choices"][0]["message"]["function_call"]["arguments"],
                )
                .unwrap_or("choices[0].message.function_call.arguments field not found".to_string())
                .replace("\\n", "")
                .replace("\\r", "")
                .replace("\\\"", "\"")
                .replace("\"{", "{")
                .replace("}\"", "}");

                format!("{{\"name\": {}, \"arguments\": {}}}", name, arguments)
            } else {
                json_response["choices"][0]["message"]["content"]
                    .as_str()
                    .unwrap_or("choices[0].message.content field not found")
                    .to_string()
            }
        } else {
            json_response.to_string()
        };

        Ok(response_text)
    }

    fn convert(&mut self) -> Result<(), rusqlite::Error> {
        let vosk_speech = self.sqlite.select_vosk(self.note_id);
        return vosk_speech.and_then(|speech| {
            let result = Self::request_whisper(
                self.speaker_language.clone(),
                speech.wav,
                self.token.clone(),
            );
            if result.is_ok() {
                let question = result.unwrap();

                let result = self.sqlite.select_ai_resource();
                let resource = if result.is_ok() {
                    let command = result.unwrap().replace("{{question}}", &question);
                    if command.is_empty() {
                        "".to_string()
                    } else {
                        let result = std::process::Command::new("sh")
                            .arg("-c")
                            .arg(command)
                            .output()
                            .expect("failed");
                        if !result.stderr.is_empty() {
                            String::from_utf8(result.stderr).expect("Found invalid UTF-8")
                        } else {
                            String::from_utf8(result.stdout).expect("Found invalid UTF-8")
                        }
                    }
                } else {
                    "".to_string()
                };
                let result = self.sqlite.select_ai_template();
                let template = if result.is_ok() {
                    if resource.is_empty() {
                        result.unwrap()
                    } else {
                        result
                            .unwrap()
                            .replace("{{resource}}", &resource)
                            .replace("{{question}}", &question)
                    }
                } else {
                    "".to_string()
                };

                let result = self.sqlite.select_ai_model();
                let model = if result.is_ok() {
                    result.unwrap()
                } else {
                    "gpt-4o-mini".to_string()
                };
                let result = self.sqlite.select_fc_functions();
                let functions = if result.is_ok() {
                    result.unwrap()
                } else {
                    "".to_string()
                };
                let result = self.sqlite.select_fc_function_call();
                let function_call = if result.is_ok() {
                    result.unwrap()
                } else {
                    "".to_string()
                };
                let result = Self::request_gpt(
                    &model,
                    &question,
                    self.token.clone(),
                    template,
                    &functions,
                    &function_call,
                );
                if result.is_ok() {
                    let answer = result.unwrap();

                    let result = self.sqlite.select_ai_hook();
                    let hook = if result.is_ok() {
                        result.unwrap()
                    } else {
                        "".to_string()
                    };
                    let output = if !hook.is_empty() {
                        let command = hook
                            .replace("{{resource}}", &resource)
                            .replace("{{answer}}", &answer)
                            .replace("{{question}}", &question);
                        let result = std::process::Command::new("sh")
                            .arg("-c")
                            .arg(command)
                            .output()
                            .expect("failed");
                        if !result.stderr.is_empty() {
                            String::from_utf8(result.stderr).expect("Found invalid UTF-8")
                        } else {
                            String::from_utf8(result.stdout).expect("Found invalid UTF-8")
                        }
                    } else {
                        "".to_string()
                    };
                    let message = if !output.is_empty() {
                        format!("Q. {}\nA. {}\nCLI. {}", question, answer, output)
                    } else {
                        format!("Q. {}\nA. {}", question, answer)
                    };

                    let updated = self.sqlite.update_model_vosk_to_whisper(speech.id, message);

                    self.app_handle
                        .clone()
                        .emit_all("finalTextConverted", updated.unwrap())
                        .unwrap();

                    let result = self.sqlite.select_ai_language();
                    if result.is_ok() {
                        let lang = result.unwrap();
                        if lang != "None" {
                            std::process::Command::new("sh")
                                .arg("-c")
                                .arg(format!("say -v {} \"{}\"", lang, answer))
                                .output()
                                .expect("failed");
                        }
                    }
                } else {
                    println!("gpt api is temporally failed, so skipping...")
                }
            } else {
                println!("whisper api is temporally failed, so skipping...")
            }
            Ok(())
        });
    }
}

pub static SINGLETON_INSTANCE: Mutex<Option<ChatOnline>> = Mutex::new(None);

pub fn initialize_chat_online(app_handle: AppHandle, speaker_language: String, note_id: u64) {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    if singleton.is_none() {
        *singleton = Some(ChatOnline::new(app_handle, speaker_language, note_id));
    }
}

pub fn drop_chat_online() {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    *singleton = None;
}
