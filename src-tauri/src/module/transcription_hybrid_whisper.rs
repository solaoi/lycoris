use crate::module::transcription_hybrid_online;

use super::{sqlite::Sqlite, transcriber::Transcriber};

use crossbeam_channel::Receiver;
use hound::SampleFormat;
use samplerate_rs::{convert, ConverterType};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use whisper_rs::WhisperContext;

pub struct TranscriptionHybridWhisper {
    app_handle: AppHandle,
    sqlite: Sqlite,
    ctx: WhisperContext,
    note_id: u64,
}

impl TranscriptionHybridWhisper {
    pub fn new(app_handle: AppHandle, note_id: u64) -> Self {
        let app_handle_clone = app_handle.clone();

        TranscriptionHybridWhisper {
            app_handle,
            sqlite: Sqlite::new(),
            ctx: Transcriber::build(app_handle_clone, "large".to_string()),
            note_id,
        }
    }

    pub fn start(&mut self, stop_convert_rx: Receiver<()>, use_no_vosk_queue_terminate_mode: bool) {
        while Self::convert(
            self,
            stop_convert_rx.clone(),
            use_no_vosk_queue_terminate_mode,
        )
        .is_ok()
        {
            if use_no_vosk_queue_terminate_mode {
                transcription_hybrid_online::initialize_transcription_hybrid_online(
                    self.app_handle.clone(),
                    self.note_id,
                );
                let mut lock = transcription_hybrid_online::SINGLETON_INSTANCE
                    .lock()
                    .unwrap();
                if let Some(singleton) = lock.as_mut() {
                    singleton.start(stop_convert_rx.clone(), use_no_vosk_queue_terminate_mode);
                }

                let vosk_speech = self
                    .sqlite
                    .select_no_proccessed_with_hybrid_whisper(self.note_id);
                if vosk_speech.is_err() {
                    break;
                }
            }
            if stop_convert_rx.try_recv().is_ok() {
                break;
            }
        }
    }

    fn convert(
        &mut self,
        stop_convert_rx: Receiver<()>,
        use_no_vosk_queue_terminate_mode: bool,
    ) -> Result<(), rusqlite::Error> {
        let vosk_speech = self
            .sqlite
            .select_no_proccessed_with_hybrid_whisper(self.note_id);

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
                Transcriber::build_params("ja".to_string(), "large".to_string()),
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

                let result = converted.join("");
                if result.is_empty() {
                    println!("Whisper returned empty content, falling back to Vosk content");
                    let mut updated = self
                        .sqlite
                        .update_model_vosk_to_whisper(speech.id, result)
                        .unwrap();
                    updated.content = speech.content;
                    self.app_handle
                        .clone()
                        .emit_all("finalTextConverted", updated)
                        .unwrap();
                } else {
                    let _updated = self.sqlite.update_hybrid_whisper_content(speech.id, result);

                    transcription_hybrid_online::initialize_transcription_hybrid_online(
                        self.app_handle.clone(),
                        self.note_id,
                    );
                    let mut lock = transcription_hybrid_online::SINGLETON_INSTANCE
                        .lock()
                        .unwrap();
                    if let Some(singleton) = lock.as_mut() {
                        singleton.start(stop_convert_rx, use_no_vosk_queue_terminate_mode);
                    }
                }
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

pub static SINGLETON_INSTANCE: Mutex<Option<TranscriptionHybridWhisper>> = Mutex::new(None);

pub fn initialize_transcription_hybrid_whisper(app_handle: AppHandle, note_id: u64) {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    if singleton.is_none() {
        *singleton = Some(TranscriptionHybridWhisper::new(app_handle, note_id));
    }
}

pub fn drop_transcription_hybrid_whisper() {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    *singleton = None;
}
