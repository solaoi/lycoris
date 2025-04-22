use tokio::runtime::Runtime;

use super::sqlite::{Speech, Sqlite};

use crossbeam_channel::Receiver;

use reqwest::{
    header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE},
    Client,
};
use serde_json::{json, to_string, Value};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, serde::Serialize)]
pub struct TraceCompletion {}

pub struct TranscriptionHybridOnline {
    runtime: Runtime,
    app_handle: AppHandle,
    sqlite: Sqlite,
    note_id: u64,
    token: String,
}

impl TranscriptionHybridOnline {
    pub fn new(app_handle: AppHandle, note_id: u64) -> Self {
        let runtime = Runtime::new().expect("Failed to create Tokio runtime");
        let sqlite = Sqlite::new();
        let token = sqlite.select_whisper_token().unwrap();
        Self {
            runtime,
            app_handle,
            sqlite,
            note_id,
            token,
        }
    }

    pub fn start(&mut self, stop_convert_rx: Receiver<()>, use_no_vosk_queue_terminate_mode: bool) {
        while Self::convert(self).is_ok() {
            if use_no_vosk_queue_terminate_mode {
                let vosk_speech = self.sqlite.select_pre_transcript_with_hybrid(self.note_id);
                if vosk_speech.is_err() {
                    self.app_handle
                        .clone()
                        .emit_all("traceCompletion", TraceCompletion {})
                        .unwrap();
                    break;
                }
            }
            if stop_convert_rx.try_recv().is_ok() {
                let vosk_speech = self.sqlite.select_pre_transcript_with_hybrid(self.note_id);
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

    fn create_json(
        hybrid_whisper_content: String,
        hybrid_reazonspeech_content: String,
        history: Vec<Speech>,
    ) -> Value {
        let mut json_data = json!({
            "transcriptions": {
                "reazonspeech": hybrid_reazonspeech_content,
                "whisper": hybrid_whisper_content,
            }
        });

        if !history.is_empty() {
            json_data["contextual_references"] = json!({
                "history":
                history.into_iter().map(|entry| {
                    json!({
                        "timestamp": entry.created_at_unixtime,
                        "content": entry.content,
                    })
                }).collect::<Vec<_>>()
            });
        }

        json_data
    }

    async fn request(
        hybrid_whisper_content: String,
        hybrid_reazonspeech_content: String,
        token: String,
        latest_speeches: Vec<Speech>,
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
        let system_prompt = String::from("あなたの役割は、ReazonSpeechとWhisperの出力を統合して「正確で読みやすい文字起こし」を作成することです。

### 目的
- **正確性の確保**：発話内容を正確に伝えます。
- **読みやすさの向上**：読み手に理解しやすい文章に仕上げます。

### 注意点
- **誤認識の修正を最優先**：文脈や一般的な知識に基づいて、誤った表現を正しく修正してください。特に専門用語や固有名詞に注意してください。
- **ハルシネーションの除去**：実際の発話に含まれていないフレーズや、関係のない内容（例：「ご視聴ありがとうございました」など）を削除してください。
- **文脈と推測の活用**：文脈から適切な言葉を推測し、誤認識を修正してください。
- **用語の一貫性**：同じ用語や表現は一貫して使用してください。
- **自然な日本語表現**：文法的に正しく、自然な日本語になるように修正してください。
- **途中で途切れた部分の明示**：発話の途中で始まったり、途中で終わっている場合は、「...」を挿入して途切れていることを明示してください。
") +
if !latest_speeches.is_empty() {"- **会話履歴の活用**：`history`（timestampとcontent）を必要に応じて参照し、誤認識の修正や表現の調整を行ってください。"}
else {""} + "

### 統合手順

1. **テキストの確定**
   - ReazonSpeechの出力をベースに発話内容を確定します。
" +
if !latest_speeches.is_empty() {"   - 必要に応じてWhisperの出力や文脈（`history`）を参考に、内容を補完します。"}
else {"   - 必要に応じてWhisperの出力を参考に、内容を補完します。"} + "

2. **誤認識の修正**
   - 文脈や一般知識を活用し、誤った表現を正しく修正します。特に専門用語や固有名詞に注意してください。

3. **句読点の挿入**
   - 読みやすさを向上させるために、適切な位置に句読点を挿入します。

4. **表現の調整**
   - 冗長な表現を避け、自然で簡潔な文章に整えます。
   - 途中から始まっている発話や、途中で終わっている発話があれば「...」を挿入して、発言の断片を示します。

5. **最終チェック**
   - 全体を見直し、一貫性と正確さ、自然な流れを確認します。

出力は以下の形式で返してください：

```json
{
  \"integrated_transcription\": \"統合された文字起こし結果をここに挿入\"
}
```";

        messages.push(json!({
            "role": "developer",
            "content": system_prompt
        }));

        messages.push(json!({
            "role": "user",
            "content": to_string(&Self::create_json(hybrid_whisper_content, hybrid_reazonspeech_content, latest_speeches)).unwrap()
        }));

        // for debugging
        // println!("messages: {:?}", messages);

        let response_format = json!({
            "type": "json_schema",
            "json_schema": {
                "name": "generate_integrated_transcription",
                "description": "ReazonSpeechとWhisperの出力を統合し、自然で正確な統合文字起こし結果を生成します。",
                "strict": true,
                "schema": {
                    "type": "object",
                    "properties": {
                        "integrated_transcription": {
                            "type": "string",
                            "description": "統合された文字起こしの結果。読みやすさと正確さを重視して生成されたものです。"
                        }
                    },
                    "required": ["integrated_transcription"],
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
                content_json["integrated_transcription"]
                    .as_str()
                    .unwrap_or("integrated_transcription field not found")
                    .to_string()
            } else {
                "Failed to parse content as JSON".to_string()
            }
        } else {
            json_response.to_string()
        };

        Ok(response_text)
    }

    fn convert(&mut self) -> Result<(), rusqlite::Error> {
        let pre_transcript = self.sqlite.select_pre_transcript_with_hybrid(self.note_id);
        let speeches = self
            .sqlite
            .select_lateset_speeches(self.note_id, 7)
            .unwrap_or(Vec::new());

        return pre_transcript.and_then(|p| {
            let whisper = p.hybrid_whisper_content;
            let reazonspeech = p.hybrid_reazonspeech_content;

            self.runtime.block_on(async {
                let result =
                    Self::request(whisper, reazonspeech, self.token.clone(), speeches).await;
                if result.is_ok() {
                    let updated = self
                        .sqlite
                        .update_model_vosk_to_whisper(p.id, result.unwrap());

                    self.app_handle
                        .clone()
                        .emit_all("finalTextConverted", updated.unwrap())
                        .unwrap();
                } else {
                    println!("whisper api is temporally failed, so skipping...")
                }
            });

            Ok(())
        });
    }
}

pub static SINGLETON_INSTANCE: Mutex<Option<TranscriptionHybridOnline>> = Mutex::new(None);

pub fn initialize_transcription_hybrid_online(app_handle: AppHandle, note_id: u64) {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    if singleton.is_none() {
        *singleton = Some(TranscriptionHybridOnline::new(app_handle, note_id));
    }
}

pub fn drop_transcription_hybrid_online() {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    *singleton = None;
}
