use super::{sqlite::Sqlite, transcriber::Transcriber, translator::Translator, speaker::Speaker};

use crossbeam_channel::Receiver;

use hound::SampleFormat;
use samplerate_rs::{convert, ConverterType};
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
        Self {
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

            // let mut ctx = Transcriber::build(self.app_handle.clone());
            // let mut ctx = self.ctx;
            let result = self.ctx.full(
                Transcriber::build_params(
                    self.speaker_language.clone(),
                    self.transcription_accuracy.clone(),
                ),
                &audio_data[..],
            );
            if result.is_ok() {
                let num_segments = self.ctx.full_n_segments();
                let mut converted: Vec<String> = vec!["".to_string()];
                for i in 0..num_segments {
                    let segment = self
                        .ctx
                        .full_get_segment_text(i)
                        .expect("failed to get segment");
                    converted.push(segment.to_string());
                }
                let mut content = converted.join("");
                if self.transcription_accuracy.ends_with("translate") {
                    let translator = Translator::new(self.app_handle.clone());
                    content = if self.transcription_accuracy.ends_with("high-translate") {
                        translator
                            .translate_to_japanese(self.speaker_language.clone(), true, &content)
                            .unwrap()
                    } else {
                        translator
                            .translate_to_japanese(self.speaker_language.clone(), false, &content)
                            .unwrap()
                    };
                }

                let updated = self.sqlite.update_model_vosk_to_whisper(speech.id, content);

                self.app_handle
                    .clone()
                    .emit_all("finalTextConverted", updated.unwrap())
                    .unwrap();
            } else {
                println!("whisper is temporally failed, so skipping...")
            }

            Ok(())
        });
    }
}
