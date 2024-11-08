use super::sqlite::Sqlite;

use crossbeam_channel::Receiver;
use hound::SampleFormat;
use sherpa_rs::zipformer::ZipFormer;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, serde::Serialize)]
pub struct TraceCompletion {}

pub struct TranscriptionJa {
    app_handle: AppHandle,
    sqlite: Sqlite,
    model: ZipFormer,
    note_id: u64,
}

impl TranscriptionJa {
    pub fn new(app_handle: AppHandle, note_id: u64) -> Self {
        let model_path = app_handle
            .path_resolver()
            .resolve_resource(format!("resources/reazonspeech"))
            .unwrap()
            .to_string_lossy()
            .to_string();
        let config = sherpa_rs::zipformer::ZipFormerConfig {
            encoder: format!("{}/encoder-epoch-99-avg-1.onnx", model_path).into(),
            decoder: format!("{}/decoder-epoch-99-avg-1.onnx", model_path).into(),
            joiner: format!("{}/joiner-epoch-99-avg-1.onnx", model_path).into(),
            tokens: format!("{}/tokens.txt", model_path).into(),
            provider: Some("cpu".to_string()), // 指定しない（CoreML）とエラーになる
            ..Default::default()
        };

        TranscriptionJa {
            app_handle,
            sqlite: Sqlite::new(),
            model: ZipFormer::new(config).unwrap(),
            note_id,
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

    fn convert(&mut self) -> Result<(), rusqlite::Error> {
        let vosk_speech = self.sqlite.select_vosk(self.note_id);

        return vosk_speech.and_then(|speech| {
            let mut reader = hound::WavReader::open(speech.wav).unwrap();

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
                    .emit_all("finalTextConverted", updated)
                    .unwrap();
                return Ok(());
            }
            // 必要なゼロパディングの秒数を定義
            let padding_seconds = 0.5; // 前後に0.5秒ずつ追加
            let padding_samples = (padding_seconds * sample_rate as f32) as usize;
            let total_samples =
                (spec.channels as usize) * (reader.duration() as usize) + (2 * padding_samples);

            let mut data = Vec::with_capacity(total_samples);

            // 前方のゼロパディングを追加
            data.extend(vec![0.0; padding_samples]);

            // 音声データの読み込み
            match (spec.bits_per_sample, spec.sample_format) {
                (16, SampleFormat::Int) => {
                    for sample in reader.samples::<i16>() {
                        data.push((sample.unwrap() as f32) / (i16::MAX as f32));
                    }
                }
                (24, SampleFormat::Int) => {
                    for sample in reader.samples::<i32>() {
                        let val = (sample.unwrap() as f32) / (0x00FF_FFFF as f32);
                        data.push(val);
                    }
                }
                (32, SampleFormat::Int) => {
                    for sample in reader.samples::<i32>() {
                        data.push((sample.unwrap() as f32) / (i32::MAX as f32));
                    }
                }
                (32, SampleFormat::Float) => {
                    for sample in reader.samples::<f32>() {
                        data.push(sample.unwrap());
                    }
                }
                _ => panic!(
                    "Tried to read file but there was a problem: {:?}",
                    hound::Error::Unsupported
                ),
            }

            // 後方のゼロパディングを追加
            data.extend(vec![0.0; padding_samples]);

            let text = self.model.decode(sample_rate, data);

            let updated = self.sqlite.update_model_vosk_to_whisper(speech.id, text);
            let updated = updated.unwrap();

            self.app_handle
                .clone()
                .emit_all("finalTextConverted", updated)
                .unwrap();

            Ok(())
        });
    }
}

pub static SINGLETON_INSTANCE: Mutex<Option<TranscriptionJa>> = Mutex::new(None);

pub fn initialize_transcription_ja(app_handle: AppHandle, note_id: u64) {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    if singleton.is_none() {
        *singleton = Some(TranscriptionJa::new(app_handle, note_id));
    }
}

pub fn drop_transcription_ja() {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    *singleton = None;
}
