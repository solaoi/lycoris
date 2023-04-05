use std::{cmp, thread::available_parallelism};

use tauri::AppHandle;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext};

pub struct Transcriber {}

impl Transcriber {
    pub fn build(app_handle: AppHandle, transcription_accuracy: String) -> WhisperContext {
        let mut model_type = "";
        if transcription_accuracy.starts_with("small") {
            model_type = "small";
        } else if transcription_accuracy.starts_with("medium") {
            model_type = "medium"
        } else if transcription_accuracy.starts_with("large") {
            model_type = "large"
        }
        let model_path = app_handle
            .path_resolver()
            .resolve_resource(format!("resources/whisper/ggml-{}.bin", model_type))
            .unwrap()
            .to_string_lossy()
            .to_string();

        return WhisperContext::new(&model_path).expect("failed to load whisper model");
    }

    pub fn build_params(
        speaker_language: String,
        transcription_accuracy: String,
    ) -> FullParams<'static, 'static> {
        let language = if speaker_language.starts_with("en-us")
            || speaker_language.starts_with("small-en-us")
        {
            "en"
        } else if speaker_language.starts_with("cn") || speaker_language.starts_with("small-cn") {
            "zh"
        } else if speaker_language.starts_with("small-ko") {
            "ko"
        } else if speaker_language.starts_with("fr") || speaker_language.starts_with("small-fr") {
            "fr"
        } else if speaker_language.starts_with("de") || speaker_language.starts_with("small-de") {
            "de"
        } else if speaker_language.starts_with("ru") || speaker_language.starts_with("small-ru") {
            "ru"
        } else if speaker_language.starts_with("es") || speaker_language.starts_with("small-es") {
            "es"
        } else if speaker_language.starts_with("small-pt") {
            "pt"
        } else if speaker_language.starts_with("small-tr") {
            "tr"
        } else if speaker_language.starts_with("vn") || speaker_language.starts_with("small-vn") {
            "vi"
        } else if speaker_language.starts_with("it") || speaker_language.starts_with("small-it") {
            "it"
        } else if speaker_language.starts_with("small-nl") {
            "nl"
        } else if speaker_language.starts_with("small-ca") {
            "ca"
        } else if speaker_language.starts_with("uk") || speaker_language.starts_with("small-uk") {
            "uk"
        } else if speaker_language.starts_with("small-sv") {
            "sv"
        } else if speaker_language.starts_with("hi") || speaker_language.starts_with("small-hi") {
            "hi"
        } else if speaker_language.starts_with("small-cs") {
            "cs"
        } else if speaker_language.starts_with("small-pl") {
            "pl"
        } else {
            "ja"
        };
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
        if transcription_accuracy.ends_with("en") {
            params.set_translate(true);
        } else {
            params.set_translate(false);
        }
        params.set_language(Some(language));
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);

        return params;
    }
}
