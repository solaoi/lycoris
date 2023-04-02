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
        } else if speaker_language.starts_with("cn") || speaker_language.starts_with("small-cn") {
            language = "zh";
        } else if speaker_language.starts_with("small-ko") {
            language = "ko";
        } else if speaker_language.starts_with("fr") || speaker_language.starts_with("small-fr") {
            language = "fr";
        } else if speaker_language.starts_with("de") || speaker_language.starts_with("small-de") {
            language = "de";
        } else if speaker_language.starts_with("ru") || speaker_language.starts_with("small-ru") {
            language = "ru";
        } else if speaker_language.starts_with("es") || speaker_language.starts_with("small-es") {
            language = "es";
        } else if speaker_language.starts_with("small-pt") {
            language = "pt";
        } else if speaker_language.starts_with("small-tr") {
            language = "tr";
        } else if speaker_language.starts_with("vn") || speaker_language.starts_with("small-vn") {
            language = "vi";
        } else if speaker_language.starts_with("it") || speaker_language.starts_with("small-it") {
            language = "it";
        } else if speaker_language.starts_with("small-nl") {
            language = "nl";
        } else if speaker_language.starts_with("small-ca") {
            language = "ca";
        } else if speaker_language.starts_with("uk") || speaker_language.starts_with("small-uk") {
            language = "uk";
        } else if speaker_language.starts_with("small-sv") {
            language = "sv";
        } else if speaker_language.starts_with("hi") || speaker_language.starts_with("small-hi") {
            language = "hi";
        } else if speaker_language.starts_with("small-cs") {
            language = "cs";
        } else if speaker_language.starts_with("small-pl") {
            language = "pl";
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
