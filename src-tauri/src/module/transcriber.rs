use std::{cmp, thread::available_parallelism};

use tauri::AppHandle;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext};

pub struct Transcriber {}

impl Transcriber {
    pub fn build(app_handle: AppHandle, transcription_accuracy: String) -> WhisperContext {
        let model_path = app_handle
            .path_resolver()
            .resolve_resource(format!(
                "resources/whisper/ggml-{}.bin",
                transcription_accuracy
            ))
            .unwrap()
            .to_string_lossy()
            .to_string();

        return WhisperContext::new(&model_path).expect("failed to load whisper model");
    }

    pub fn build_params(speaker_language: String) -> FullParams<'static, 'static> {
        let mut language = "ja";
        if speaker_language.starts_with("en-us") || speaker_language.starts_with("small-en-us") {
            language = "en";
        }
        let mut params = FullParams::new(SamplingStrategy::BeamSearch {
            beam_size: 5,
            patience: 1.0,
        });
        let hardware_concurrency = cmp::min(
            8,
            available_parallelism().map(|n| n.get() as i32).unwrap_or(8),
        );
        println!("working on {} threads.", hardware_concurrency);
        params.set_n_threads(hardware_concurrency);
        params.set_translate(false);
        params.set_language(Some(language));
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);

        return params;
    }
}
