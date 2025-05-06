use std::{cmp, thread::available_parallelism};

use tauri::{path::BaseDirectory, AppHandle, Manager};
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
            .path()
            .resolve(
                format!("resources/whisper/ggml-{}.bin", model_type),
                BaseDirectory::Resource,
            )
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
                params.set_initial_prompt("これは日本語の音声です。適切な句読点を用いて正確に書き起こしてください。");
                params.set_language(Some("ja"));
            } else if language == "ja" {
                params.set_initial_prompt("This is an audio in English. Please transcribe it accurately with appropriate punctuation.");
                params.set_language(Some("en"));
            }
        } else {
            params.set_language(Some(language));
            if transcription_accuracy.ends_with("en") {
                params.set_translate(true);
                params.set_initial_prompt("This is an audio in English. Please transcribe it accurately with appropriate punctuation.");
            } else {
                params.set_translate(false);
                if language == "en" {
                    params.set_initial_prompt("This is an audio in English. Please transcribe it accurately with appropriate punctuation.");
                } else if language == "zh" {
                    params.set_initial_prompt("这是中文音频。请使用适当的标点符号准确记录。");
                } else if language == "ko" {
                    params.set_initial_prompt("이것은 한국어 음성입니다. 적절한 문장부호를 사용하여 정확하게 받아써 주세요.");
                } else if language == "fr" {
                    params.set_initial_prompt("Ceci est un audio en français. Veuillez le transcrire avec précision en utilisant la ponctuation appropriée.");
                } else if language == "de" {
                    params.set_initial_prompt("Dies ist eine deutsche Audioaufnahme. Bitte transkribieren Sie sie genau mit der entsprechenden Interpunktion.");
                } else if language == "ru" {
                    params.set_initial_prompt("Это аудио на русском языке. Пожалуйста, сделайте точную расшифровку с правильной пунктуацией.");
                } else if language == "es" {
                    params.set_initial_prompt("Este es un audio en español. Por favor, transcríbalo con precisión usando la puntuación adecuada.");
                } else if language == "pt" {
                    params.set_initial_prompt("Este é um áudio em português. Por favor, transcreva-o com precisão usando a pontuação adequada.");
                } else if language == "tr" {
                    params.set_initial_prompt("Bu bir Türkçe ses kaydıdır. Lütfen uygun noktalama işaretlerini kullanarak doğru bir şekilde yazıya dökün.");
                } else if language == "vi" {
                    params.set_initial_prompt("Đây là bản ghi âm tiếng Việt. Vui lòng ghi chép chính xác với dấu câu phù hợp.");
                } else if language == "it" {
                    params.set_initial_prompt("Questo è un audio in italiano. Si prega di trascriverlo accuratamente con la punteggiatura appropriata.");
                } else if language == "nl" {
                    params.set_initial_prompt("Dit is een Nederlandse audio. Gelieve deze nauwkeurig te transcriberen met de juiste interpunctie.");
                } else if language == "ca" {
                    params.set_initial_prompt("Aquest és un àudio en català. Si us plau, transcriviu-lo amb precisió utilitzant la puntuació adequada.");
                } else if language == "uk" {
                    params.set_initial_prompt("Це аудіо українською мовою. Будь ласка, зробіть точний транскрипт з правильною пунктуацією.");
                } else if language == "sv" {
                    params.set_initial_prompt("Detta är ett svenskt ljudklipp. Var god transkribera det noggrant med lämplig interpunktion.");
                } else if language == "hi" {
                    params.set_initial_prompt("यह हिंदी में ऑडियो है। कृपया उचित विराम चिह्नों का उपयोग करते हुए सटीक प्रतिलेखन करें।");
                } else if language == "cs" {
                    params.set_initial_prompt("Toto je audio v češtině. Prosím, přepište jej přesně s použitím vhodné interpunkce.");
                } else if language == "pl" {
                    params.set_initial_prompt("To jest nagranie w języku polskim. Proszę dokonać dokładnej transkrypcji z odpowiednią interpunkcją.");
                } else if language == "ja" {
                    params.set_initial_prompt("これは日本語の音声です。適切な句読点を用いて正確に書き起こしてください。");
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
