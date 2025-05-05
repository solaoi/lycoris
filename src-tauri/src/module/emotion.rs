use std::sync::Mutex;

use super::sqlite::Sqlite;

use hound::WavReader;

use hound::SampleFormat;
use ndarray::Array;
use ort::{GraphOptimizationLevel, Session, SessionBuilder, Value};
use samplerate_rs::{convert, ConverterType};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, serde::Serialize)]
struct EmotionAnalyzedPayload {
    id: u16,
    emotion: u16,
}

pub struct Emotion {
    app_handle: AppHandle,
    sqlite: Sqlite,
    note_id: u64,
    session: Session,
}

impl Emotion {
    pub fn new(app_handle: AppHandle, note_id: u64) -> Self {
        let model_path = app_handle
            .path_resolver()
            .resolve_resource(format!("resources"))
            .unwrap()
            .to_string_lossy()
            .to_string();

        let sqlite = Sqlite::new();
        let session: Session = SessionBuilder::new()
            .unwrap()
            .with_optimization_level(GraphOptimizationLevel::Level3)
            .unwrap()
            .with_intra_threads(1)
            .unwrap()
            .commit_from_file(format!("{}/kushinada-hubert-large-jtes-er.onnx", model_path))
            .unwrap();

        Emotion {
            app_handle,
            sqlite,
            note_id,
            session,
        }
    }

    fn softmax(xs: &[f32]) -> Vec<f32> {
        let m = xs.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
        let exps: Vec<f32> = xs.iter().map(|x| (x - m).exp()).collect();
        let sum: f32 = exps.iter().sum();
        exps.into_iter().map(|e| e / sum).collect()
    }

    fn execute(&mut self) -> Result<(), rusqlite::Error> {
        let speech_with_no_emotion = self.sqlite.select_speech_with_no_emotion(self.note_id);

        speech_with_no_emotion.and_then(|speech| {
            let mut reader = WavReader::open(speech.wav).unwrap();
            let spec = reader.spec();
            let mut data =
                Vec::with_capacity((spec.channels as usize) * (reader.duration() as usize));
            match (spec.bits_per_sample, spec.sample_format) {
                (16, SampleFormat::Int) => {
                    for sample in reader.samples::<i16>() {
                        data.push((sample.unwrap() as f32) / (0x7fffi32 as f32));
                    }
                }
                (24, SampleFormat::Int) => {
                    for sample in reader.samples::<i32>() {
                        let val = (sample.unwrap() as f32) / (0x00ff_ffffi32 as f32);
                        data.push(val);
                    }
                }
                (32, SampleFormat::Int) => {
                    for sample in reader.samples::<i32>() {
                        data.push((sample.unwrap() as f32) / (0x7fff_ffffi32 as f32));
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
            let data = if spec.channels != 1 {
                whisper_rs::convert_stereo_to_mono_audio(&data).unwrap()
            } else {
                data
            };
            let samples = convert(
                spec.sample_rate,
                16000,
                1,
                ConverterType::SincBestQuality,
                &data,
            )
            .unwrap();

            let input_nd: Array<f32, _> =
                Array::from_shape_vec((1, samples.len()), samples).unwrap();

            let input_val = Value::from_array(input_nd).unwrap();
            let outputs = self
                .session
                .run(vec![("input".to_string(), input_val)])
                .unwrap();

            let output_val = outputs.get("logits").unwrap();
            let tensor = output_val.try_extract_tensor::<f32>().unwrap();
            let arr = tensor.view();
            let logits = arr.as_slice().unwrap();

            let probs = Self::softmax(logits);
            let (pred_idx, &_pred_prob) = probs
                .iter()
                .enumerate()
                .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
                .unwrap();

            // let labels = ["neu", "hap", "ang", "sad"];
            // println!("\n=== 感情推論結果 ===");
            // for (i, &p) in probs.iter().enumerate() {
            //     println!("  {}: {:.3}", labels[i], p);
            // }
            // println!("→ 予測ラベル: {} ({:.3})", labels[pred_idx], pred_prob);

            let emotion_id = pred_idx as u16 + 1;
            let _ = self
                .sqlite
                .update_speech_emotion_done(speech.id, emotion_id);
            if emotion_id > 1 {
                self.app_handle
                    .emit_all(
                        "emotionAnalyzed",
                        EmotionAnalyzedPayload {
                            id: speech.id,
                            emotion: emotion_id,
                        },
                    )
                    .unwrap();
            }

            Ok(())
        })
    }

    pub fn start(&mut self) {
        while self.execute().is_ok() {
            println!("Processed one item. Checking if there's next...");
        }
        println!("No more items or encountered an error. Stop loop.");
    }
}

pub static SINGLETON_INSTANCE: Mutex<Option<Emotion>> = Mutex::new(None);

pub fn initialize_emotion(app_handle: AppHandle, note_id: u64) {
    let mut lock = SINGLETON_INSTANCE.lock().unwrap();
    if lock.is_none() {
        *lock = Some(Emotion::new(app_handle, note_id));
    }
}

pub fn drop_emotion() {
    let mut lock = SINGLETON_INSTANCE.lock().unwrap();
    *lock = None;
}

pub fn start_emotion() {
    let mut lock = SINGLETON_INSTANCE.lock().unwrap();
    if let Some(emotion) = lock.as_mut() {
        emotion.start();
    } else {
        println!("Emotion is not initialized (skipped).");
    }
}
