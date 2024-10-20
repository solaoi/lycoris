use super::{sqlite::Sqlite, transcriber::Transcriber};

use crossbeam_channel::Receiver;
use hound::SampleFormat;
use mistralrs::{
    Constraint, DefaultSchedulerMethod, Device, DeviceMapMetadata, MistralRs, MistralRsBuilder,
    ModelDType, NormalLoaderBuilder, NormalLoaderType, NormalRequest, NormalSpecificConfig,
    Request, RequestMessage, ResponseOk, SamplingParams, SchedulerConfig, TokenSource,
};
use samplerate_rs::{convert, ConverterType};
use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};
use tauri::{AppHandle, Manager};
use tokio::sync::mpsc::channel;
use whisper_rs::WhisperContext;

#[derive(Debug, Clone, serde::Serialize)]
pub struct TraceCompletion {}

pub struct TranslationJaHigh {
    app_handle: AppHandle,
    sqlite: Sqlite,
    ctx: WhisperContext,
    translator: Arc<MistralRs>,
    speaker_language: String,
    note_id: u64,
}

impl TranslationJaHigh {
    pub fn new(app_handle: AppHandle, speaker_language: String, note_id: u64) -> Self {
        let app_handle_clone = app_handle.clone();
        let model_path = app_handle
            .path_resolver()
            .resolve_resource(format!("resources/honyaku-13b"))
            .unwrap()
            .to_string_lossy()
            .to_string();
        let loader = NormalLoaderBuilder::new(
            NormalSpecificConfig {
                use_flash_attn: false,
                prompt_batchsize: None,
                topology: None,
                organization: Default::default(),
                write_uqff: None,
                from_uqff: Some(PathBuf::from(format!(
                    "{}/Honyaku-13b-q4_0.uqff",
                    model_path
                ))),
            },
            None,
            None,
            Some(model_path),
        )
        .build(Some(NormalLoaderType::Llama))
        .unwrap();
        let pipeline = loader
            .load_model_from_hf(
                None,
                TokenSource::None,
                &ModelDType::Auto,
                &Device::new_metal(0).unwrap(),
                false,
                DeviceMapMetadata::dummy(),
                None,
                None,
            )
            .unwrap();

        TranslationJaHigh {
            app_handle,
            sqlite: Sqlite::new(),
            ctx: Transcriber::build(app_handle_clone, "large-translate-to-en".to_string()),
            translator: MistralRsBuilder::new(
                pipeline,
                SchedulerConfig::DefaultScheduler {
                    method: DefaultSchedulerMethod::Fixed(5.try_into().unwrap()),
                },
            )
            .with_no_prefix_cache(true)
            .build(),
            speaker_language,
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
                    self.speaker_language.clone(),
                    "large-translate-to-en".to_string(),
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
                let prompt = format!("<english>: {} <NL>\n\n<japanese>: ", result_on_whisper);
                let (tx, mut rx) = channel(1);
                let request = Request::Normal(NormalRequest {
                    messages: RequestMessage::Completion {
                        text: prompt,
                        echo_prompt: false,
                        best_of: 1,
                    },
                    sampling_params: SamplingParams::deterministic(),
                    response: tx,
                    return_logprobs: false,
                    is_streaming: false,
                    id: 0,
                    constraint: Constraint::None,
                    suffix: None,
                    adapters: None,
                    tools: None,
                    tool_choice: None,
                    logits_processors: None,
                });
                self.translator
                    .get_sender()
                    .unwrap()
                    .blocking_send(request)
                    .unwrap();
                let mut translated;
                let response = rx.blocking_recv().unwrap().as_result().unwrap();
                match response {
                    ResponseOk::CompletionDone(c) => translated = c.choices[0].text.clone(),
                    _ => unreachable!(),
                }
                print!("translated: {}", translated);
                let parts: Vec<&str> = translated.split("<NL>").collect();
                if let Some(first_part) = parts.get(0) {
                    translated = first_part.to_string();
                }

                let updated = self
                    .sqlite
                    .update_model_vosk_to_whisper(speech.id, translated);

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

pub static SINGLETON_INSTANCE: Mutex<Option<TranslationJaHigh>> = Mutex::new(None);

pub fn initialize_translation_ja_high(
    app_handle: AppHandle,
    speaker_language: String,
    note_id: u64,
) {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    if singleton.is_none() {
        *singleton = Some(TranslationJaHigh::new(
            app_handle,
            speaker_language,
            note_id,
        ));
    }
}

pub fn drop_translation_ja_high() {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    *singleton = None;
}
