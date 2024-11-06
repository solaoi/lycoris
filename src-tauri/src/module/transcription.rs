use super::{sqlite::Sqlite, transcriber::Transcriber};

use crossbeam_channel::Receiver;
use hound::SampleFormat;
use samplerate_rs::{convert, ConverterType};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use whisper_rs::WhisperContext;

#[derive(Debug, Clone, serde::Serialize)]
pub struct TraceCompletion {}

pub struct Transcription {
    app_handle: AppHandle,
    sqlite: Sqlite,
    ctx: WhisperContext,
    speaker_language: String,
    transcription_accuracy: String,
    note_id: u64,
}

impl Transcription {
    pub fn new(
        app_handle: AppHandle,
        transcription_accuracy: String,
        speaker_language: String,
        note_id: u64,
    ) -> Self {
        let app_handle_clone = app_handle.clone();
        Transcription {
            app_handle,
            sqlite: Sqlite::new(),
            ctx: Transcriber::build(app_handle_clone, transcription_accuracy.clone()),
            speaker_language,
            transcription_accuracy,
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
            if (reader.duration() / spec.sample_rate as u32) < 1 {
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
                    self.speaker_language.clone(),
                    self.transcription_accuracy.clone(),
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

                let updated = self
                    .sqlite
                    .update_model_vosk_to_whisper(speech.id, converted.join(""));

                let mut updated = updated.unwrap();
                if updated.content.is_empty() {
                    println!("Whisper returned empty content, falling back to Vosk content");
                    updated.content = speech.content;
                }
                self.app_handle
                    .clone()
                    .emit_all("finalTextConverted", updated)
                    .unwrap();
            } else {
                println!("whisper is temporally failed, so skipping...");
                let mut updated = self
                    .sqlite
                    .update_model_vosk_to_whisper(speech.id, "".to_string())
                    .unwrap();
                updated.content = speech.content;
                self.app_handle
                    .clone()
                    .emit_all("finalTextConverted", updated)
                    .unwrap();
            }

            Ok(())
        });
    }
}

pub static SINGLETON_INSTANCE: Mutex<Option<Transcription>> = Mutex::new(None);

pub fn initialize_transcription(
    app_handle: AppHandle,
    transcription_accuracy: String,
    speaker_language: String,
    note_id: u64,
) {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    if singleton.is_none() {
        *singleton = Some(Transcription::new(
            app_handle,
            transcription_accuracy,
            speaker_language,
            note_id,
        ));
    }
}

pub fn drop_transcription() {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    *singleton = None;
}
