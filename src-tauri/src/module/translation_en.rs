use super::{sqlite::Sqlite, transcriber::Transcriber};

use crossbeam_channel::Receiver;
use ct2rs::{tokenizers::auto::Tokenizer, Config, TranslationOptions, Translator};
use hound::SampleFormat;
use samplerate_rs::{convert, ConverterType};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use whisper_rs::WhisperContext;

#[derive(Debug, Clone, serde::Serialize)]
pub struct TraceCompletion {}

pub struct TranslationEn {
    app_handle: AppHandle,
    sqlite: Sqlite,
    ctx: WhisperContext,
    translator: Translator<Tokenizer>,
    note_id: u64,
}

impl TranslationEn {
    pub fn new(app_handle: AppHandle, note_id: u64) -> Self {
        let app_handle_clone = app_handle.clone();
        let model_path = app_handle
            .path_resolver()
            .resolve_resource(format!("resources/fugumt-ja-en"))
            .unwrap()
            .to_string_lossy()
            .to_string();

        TranslationEn {
            app_handle,
            sqlite: Sqlite::new(),
            ctx: Transcriber::build(app_handle_clone, "large".to_string()),
            translator: Translator::new(&model_path, &Config::default()).unwrap(),
            note_id,
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

    fn convert(&mut self) -> Result<(), rusqlite::Error> {
        let vosk_speech = self.sqlite.select_vosk(self.note_id);
        return vosk_speech.and_then(|speech| {
            let mut reader = hound::WavReader::open(speech.wav).unwrap();

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
            let audio_data = convert(
                spec.sample_rate,
                16000,
                1,
                ConverterType::SincBestQuality,
                &data,
            )
            .unwrap();

            let mut state = self.ctx.create_state().expect("failed to create state");
            let result = state.full(
                Transcriber::build_params(
                    "ja".to_string(),
                    "large".to_string(),
                ),
                &audio_data[..],
            );
            if result.is_ok() {
                let num_segments = state
                    .full_n_segments()
                    .expect("failed to get number of segments");
                let mut converted: Vec<String> = vec!["".to_string()];
                for i in 0..num_segments {
                    let segment = state.full_get_segment_text(i);
                    if segment.is_ok() {
                        converted.push(segment.unwrap().to_string());
                    };
                }

                let result_on_whisper = converted.join("");
                let sources: Vec<String> = result_on_whisper.lines().map(String::from).collect();
                let res: Vec<(String, Option<f32>)> = self
                    .translator
                    .translate_batch(
                        &sources,
                        &TranslationOptions {
                            beam_size: 5,
                            ..Default::default()
                        },
                        None,
                    )
                    .unwrap();
                let mut translated: Vec<String> = vec!["".to_string()];
                for (r, _) in res {
                    translated.push(r);
                }

                let updated = self
                    .sqlite
                    .update_model_vosk_to_whisper(speech.id, translated.join(""));

                let updated = updated.unwrap();
                if updated.content != "" {
                    self.app_handle
                        .clone()
                        .emit_all("finalTextConverted", updated)
                        .unwrap();
                }
            } else {
                println!("whisper is temporally failed, so skipping...")
            }

            Ok(())
        });
    }
}

pub static SINGLETON_INSTANCE: Mutex<Option<TranslationEn>> = Mutex::new(None);

pub fn initialize_translation_en(app_handle: AppHandle, note_id: u64) {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    if singleton.is_none() {
        *singleton = Some(TranslationEn::new(app_handle, note_id));
    }
}

pub fn drop_translation_en() {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    *singleton = None;
}
