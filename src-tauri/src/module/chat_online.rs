use tokio::{fs::File, io::AsyncReadExt};

use super::sqlite::Sqlite;

use crossbeam_channel::Receiver;

use reqwest::{
    header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE},
    multipart, Client,
};
use serde_json::{json, Value};
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

    pub fn start(&mut self, stop_convert_rx: Receiver<()>, is_continuous: bool) {
        while Self::convert(self).is_ok() {
            if is_continuous {
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

        println!("Status: {}", response.status());
        let json_response: Value = response.json().await?;
        println!("Response: {:?}", json_response);
        let response_text = json_response["text"]
            .as_str()
            .unwrap_or("text field not found");

        Ok(response_text.to_string())
    }

    #[tokio::main]
    async fn request_gpt(
        question: &str,
        token: String,
        template: String,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let url = "https://api.openai.com/v1/chat/completions";

        let model = "gpt-3.5-turbo";
        let temperature = 0;

        let client = Client::new();

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", token))?,
        );
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        let post_body = if template != "" {
            json!({
              "model": model,
              "temperature": temperature,
              "messages": [{"role": "system", "content": template},{"role": "user", "content": question}]
            })
        } else {
            json!({
              "model": model,
              "temperature": temperature,
              "messages": [{"role": "user", "content": question}]
            })
        };

        let response = client
            .post(url)
            .headers(headers)
            .json(&post_body)
            .send()
            .await?;

        println!("Status: {}", response.status());
        let json_response: Value = response.json().await?;
        println!("Response: {:?}", json_response);
        let response_text = json_response["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("choices[0].message.content field not found");

        Ok(response_text.to_string())
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
                let result = self.sqlite.select_ai_template();
                let template = if result.is_ok() {
                    result.unwrap()
                } else {
                    "".to_string()
                };
                let result = Self::request_gpt(&question, self.token.clone(), template);
                if result.is_ok() {
                    let answer = result.unwrap();
                    let updated = self.sqlite.update_model_vosk_to_whisper(
                        speech.id,
                        format!("Q. {}\nA. {}", question, answer),
                    );

                    self.app_handle
                        .clone()
                        .emit_all("finalTextConverted", updated.unwrap())
                        .unwrap();
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
