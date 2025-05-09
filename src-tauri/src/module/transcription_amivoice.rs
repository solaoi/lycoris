use hound::{SampleFormat, WavReader, WavSpec, WavWriter};
use tokio::{fs::File, io::AsyncReadExt};

use super::sqlite::Sqlite;

use crossbeam_channel::Receiver;

use reqwest::{multipart, Client};
use serde_json::Value;
use std::io::Cursor;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, serde::Serialize)]
pub struct TraceCompletion {}

pub struct TranscriptionAmivoice {
    app_handle: AppHandle,
    sqlite: Sqlite,
    note_id: u64,
    token: String,
    model: String,
    logging: String,
}

impl TranscriptionAmivoice {
    pub fn new(app_handle: AppHandle, note_id: u64) -> Self {
        let sqlite = Sqlite::new(app_handle.clone());
        let token = sqlite.select_amivoice_token().unwrap();
        let model = sqlite.select_amivoice_model().unwrap();
        let logging = sqlite.select_amivoice_logging().unwrap();
        Self {
            app_handle,
            sqlite,
            note_id,
            token,
            model,
            logging,
        }
    }

    pub fn start(&mut self, stop_convert_rx: Receiver<()>, use_no_vosk_queue_terminate_mode: bool) {
        while Self::convert(self).is_ok() {
            if use_no_vosk_queue_terminate_mode {
                let vosk_speech = self.sqlite.select_vosk(self.note_id);
                if vosk_speech.is_err() {
                    self.app_handle
                        .clone()
                        .emit("traceCompletion", TraceCompletion {})
                        .unwrap();
                    break;
                }
            }
            if stop_convert_rx.try_recv().is_ok() {
                let vosk_speech = self.sqlite.select_vosk(self.note_id);
                if vosk_speech.is_err() {
                    self.app_handle
                        .clone()
                        .emit("traceCompletion", TraceCompletion {})
                        .unwrap();
                } else {
                    self.app_handle
                        .clone()
                        .emit("traceUnCompletion", TraceCompletion {})
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
        logging: String,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let url = if logging == "on" {
            "https://acp-api.amivoice.com/v1/recognize"
        } else {
            "https://acp-api.amivoice.com/v1/nolog/recognize"
        };
        let client = Client::new();

        let mut file = File::open(file_path).await?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).await?;

        let cursor = Cursor::new(buffer);
        let mut reader = WavReader::new(cursor)?;
        let spec = WavSpec {
            channels: reader.spec().channels,
            sample_rate: reader.spec().sample_rate,
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

        let json_response: Value = response.json().await?;
        let response_text = json_response["results"][0]["text"]
            .as_str()
            .unwrap_or("text field not found");

        Ok(response_text.to_string())
    }

    fn convert(&mut self) -> Result<(), rusqlite::Error> {
        let vosk_speech = self.sqlite.select_vosk(self.note_id);
        return vosk_speech.and_then(|speech| {
            let reader = hound::WavReader::open(speech.wav.clone()).unwrap();

            let spec = reader.spec();
            let sample_rate = spec.sample_rate;
            let is_too_short = (reader.duration() / sample_rate as u32) < 1;

            if is_too_short {
                println!("input is too short, so skipping...");
                let mut updated = self
                    .sqlite
                    .update_model_vosk_to_whisper(speech.id, "".to_string())
                    .unwrap();
                updated.content = speech.content;
                self.app_handle
                    .clone()
                    .emit("finalTextConverted", updated)
                    .unwrap();
                return Ok(());
            }

            let result = Self::request(
                speech.wav,
                self.token.clone(),
                self.model.clone(),
                self.logging.clone(),
            );

            if result.is_ok() {
                let updated = self
                    .sqlite
                    .update_model_vosk_to_whisper(speech.id, result.unwrap());

                self.app_handle
                    .clone()
                    .emit("finalTextConverted", updated.unwrap())
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
