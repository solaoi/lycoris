use std::{cmp, thread::available_parallelism};

use tauri::AppHandle;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

pub struct Transcriber {}

impl Transcriber {
    pub fn build(app_handle: AppHandle, transcription_accuracy: String) -> WhisperContext {
        let mut model_type = "";
        if transcription_accuracy.starts_with("small") {
            model_type = "small";
        } else if transcription_accuracy.starts_with("medium") {
            model_type = "medium"
        } else if transcription_accuracy.starts_with("large-distil.en") {
            model_type = "large-distil.en"
        } else if transcription_accuracy.starts_with("large-distil.ja") {
            model_type = "large-distil.ja"
        } else if transcription_accuracy.starts_with("large-distil.bilingual") {
            model_type = "large-distil.bilingual"
        } else if transcription_accuracy.starts_with("large-turbo") {
            model_type = "large-turbo"
        } else if transcription_accuracy.starts_with("large") {
            model_type = "large"
        }
        let model_path = app_handle
            .path_resolver()
            .resolve_resource(format!("resources/whisper/ggml-{}.bin", model_type))
            .unwrap()
            .to_string_lossy()
            .to_string();

        return WhisperContext::new_with_params(
            &model_path,
            WhisperContextParameters {
                flash_attn: true,
                ..WhisperContextParameters::default()
            },
        )
        .expect("failed to load whisper model");
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
            beam_size: 2,
            patience: 1.0,
        });
        let hardware_concurrency = cmp::min(
            8,
            available_parallelism().map(|n| n.get() as i32).unwrap_or(8),
        );
        println!("working on {} threads.", hardware_concurrency);
        params.set_n_threads(hardware_concurrency);

        if transcription_accuracy.starts_with("large-distil.bilingual") {
            params.set_translate(true);
            if language == "en" {
                params.set_initial_prompt("こんにちは、私の講義へようこそ。");
                params.set_language(Some("ja"));
            } else if language == "ja" {
                params.set_initial_prompt("Hello, welcome to my lecture.");
                params.set_language(Some("en"));
            }
        } else {
            params.set_language(Some(language));
            if transcription_accuracy.ends_with("en") {
                params.set_translate(true);
                params.set_initial_prompt("Hello, welcome to my lecture.");
            } else {
                params.set_translate(false);
                if language == "en" {
                    params.set_initial_prompt("Hello, welcome to my lecture.");
                } else if language == "zh" {
                    params.set_initial_prompt("你好，欢迎来到我的讲座。");
                } else if language == "ko" {
                    params.set_initial_prompt("안녕하세요, 제 강의에 오신 것을 환영합니다.");
                } else if language == "fr" {
                    params.set_initial_prompt("Bonjour, bienvenue à mon cours.");
                } else if language == "de" {
                    params.set_initial_prompt("Hallo, willkommen zu meiner Vorlesung.");
                } else if language == "ru" {
                    params.set_initial_prompt("Привет, добро пожаловать на мою лекцию.");
                } else if language == "es" {
                    params.set_initial_prompt("Hola, bienvenido a mi conferencia.");
                } else if language == "pt" {
                    params.set_initial_prompt("Olá, bem-vindo à minha palestra.");
                } else if language == "tr" {
                    params.set_initial_prompt("Merhaba, dersime hoş geldiniz.");
                } else if language == "vi" {
                    params.set_initial_prompt("Xin chào, chào mừng bạn đến với bài giảng của tôi.");
                } else if language == "it" {
                    params.set_initial_prompt("Ciao, benvenuto alla mia conferenza.");
                } else if language == "nl" {
                    params.set_initial_prompt("Hallo, welkom bij mijn lezing.");
                } else if language == "ca" {
                    params.set_initial_prompt("Hola, benvingut a la meva conferència.");
                } else if language == "uk" {
                    params.set_initial_prompt("Привіт, ласкаво просимо на мою лекцію.");
                } else if language == "sv" {
                    params.set_initial_prompt("Hej, välkommen till min föreläsning.");
                } else if language == "hi" {
                    params.set_initial_prompt("नमस्ते, मेरे व्याख्यान में आपका स्वागत है।");
                } else if language == "cs" {
                    params.set_initial_prompt("Ahoj, vítejte na mé přednášce.");
                } else if language == "pl" {
                    params.set_initial_prompt("Cześć, witaj na mojej wykładzie.");
                } else if language == "ja" {
                    params.set_initial_prompt("こんにちは、私の講義へようこそ。");
                }
            }
        }
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);

        return params;
    }
}
