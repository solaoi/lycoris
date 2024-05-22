use hound::{SampleFormat, WavReader, WavSpec, WavWriter};
use tokio::{fs::File, io::AsyncReadExt};

use super::sqlite::Sqlite;

use crossbeam_channel::Receiver;

use reqwest::{multipart, Client};
use serde_json::Value;
use std::io::Cursor;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, serde::Serialize)]
pub struct TraceCompletion {}

pub struct TranscriptionAmivoice {
    app_handle: AppHandle,
    sqlite: Sqlite,
    note_id: u64,
    token: String,
    model: String,
}

impl TranscriptionAmivoice {
    pub fn new(app_handle: AppHandle, note_id: u64) -> Self {
        let sqlite = Sqlite::new();
        let token = sqlite.select_amivoice_token().unwrap();
        let model = sqlite.select_amivoice_model().unwrap();
        Self {
            app_handle,
            sqlite,
            note_id,
            token,
            model,
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
    async fn request(
        file_path: String,
        token: String,
        model: String,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let url = "https://acp-api.amivoice.com/v1/nolog/recognize";
        let client = Client::new();

        let mut file = File::open(file_path).await?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).await?;

        let cursor = Cursor::new(buffer);
        let mut reader = WavReader::new(cursor)?;
        let spec = WavSpec {
            channels: 1,
            sample_rate: 48000,
            bits_per_sample: 16,
            sample_format: SampleFormat::Int,
        };
        let mut converted_buffer = Vec::new();
        {
            let mut cursor = Cursor::new(&mut converted_buffer);
            let mut writer = WavWriter::new(&mut cursor, spec)?;

            match reader.spec().sample_format {
                SampleFormat::Int => {
                    for sample in reader.samples::<i32>() {
                        match sample {
                            Ok(sample) => {
                                let scaled_sample = (sample >> 16) as i16;
                                writer.write_sample(scaled_sample)?;
                            }
                            Err(e) => {
                                eprintln!("Error reading sample: {:?}", e);
                            }
                        }
                    }
                }
                SampleFormat::Float => {
                    for sample in reader.samples::<f32>() {
                        match sample {
                            Ok(sample) => {
                                let scaled_sample = (sample * i16::MAX as f32)
                                    .clamp(i16::MIN as f32, i16::MAX as f32)
                                    as i16;
                                writer.write_sample(scaled_sample)?;
                            }
                            Err(e) => {
                                eprintln!("Error reading sample: {:?}", e);
                            }
                        }
                    }
                }
            }
            writer.finalize()?;
        }

        let part_file = multipart::Part::bytes(converted_buffer)
            .file_name("test.wav")
            .mime_str("audio/wav")?;
        let part_model = multipart::Part::text(format!("grammarFileNames=-a-{}", model));
        let part_token = multipart::Part::text(token.clone());

        let form = multipart::Form::new()
            .part("u", part_token)
            .part("d", part_model)
            .part("a", part_file);

        let response = client.post(url).multipart(form).send().await?;

        println!("Status: {}", response.status());
        let json_response: Value = response.json().await?;
        println!("Response: {:?}", json_response);
        let response_text = json_response["results"][0]["text"]
            .as_str()
            .unwrap_or("text field not found");

        Ok(response_text.to_string())
    }

    fn convert(&mut self) -> Result<(), rusqlite::Error> {
        let vosk_speech = self.sqlite.select_vosk(self.note_id);
        return vosk_speech.and_then(|speech| {
            let result = Self::request(speech.wav, self.token.clone(), self.model.clone());

            if result.is_ok() {
                let updated = self
                    .sqlite
                    .update_model_vosk_to_whisper(speech.id, result.unwrap());

                self.app_handle
                    .clone()
                    .emit_all("finalTextConverted", updated.unwrap())
                    .unwrap();
            } else {
                println!("amivoice api is temporally failed, so skipping...")
            }

            Ok(())
        });
    }
}

pub static SINGLETON_INSTANCE: Mutex<Option<TranscriptionAmivoice>> = Mutex::new(None);

pub fn initialize_transcription_amivoice(app_handle: AppHandle, note_id: u64) {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    if singleton.is_none() {
        *singleton = Some(TranscriptionAmivoice::new(app_handle, note_id));
    }
}

pub fn drop_transcription_amivoice() {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    *singleton = None;
}
