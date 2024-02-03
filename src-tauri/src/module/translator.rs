// use rust_bert::pipelines::translation::{Language, TranslationModelBuilder};
extern crate anyhow;

use std::env::set_var;

use rust_bert::nllb::{
    NLLBConfigResources, NLLBLanguages, NLLBMergeResources, NLLBResources, NLLBVocabResources,
};
use rust_bert::pipelines::common::ModelType;
use rust_bert::pipelines::translation::{TranslationConfig, TranslationModel, Language};
use rust_bert::resources::RemoteResource;
use tauri::AppHandle;
use tch::Device;

pub struct Translator {}

impl Translator {
    pub fn new(app_handle: AppHandle) -> Self {
        let dir: String = app_handle
            .path_resolver()
            .resolve_resource("resources")
            .unwrap()
            .to_string_lossy()
            .to_string();
        set_var("RUSTBERT_CACHE", dir);
        Self {}
    }

    pub fn translate_to_japanese(
        &self,
        speaker_language: String,
        is_high_quality: bool,
        text: &str,
    ) -> anyhow::Result<String> {
        let model_resource = if is_high_quality {
            RemoteResource::from_pretrained(NLLBResources::NLLB_1_3B)
        } else {
            RemoteResource::from_pretrained(NLLBResources::NLLB_600M_DISTILLED)
        };
        let config_resource = if is_high_quality {
            RemoteResource::from_pretrained(NLLBConfigResources::NLLB_1_3B)
        } else {
            RemoteResource::from_pretrained(NLLBConfigResources::NLLB_600M_DISTILLED)
        };
        let vocab_resource = if is_high_quality {
            RemoteResource::from_pretrained(NLLBVocabResources::NLLB_1_3B)
        } else {
            RemoteResource::from_pretrained(NLLBVocabResources::NLLB_600M_DISTILLED)
        };
        let merges_resource = if is_high_quality {
            RemoteResource::from_pretrained(NLLBMergeResources::NLLB_1_3B)
        } else {
            RemoteResource::from_pretrained(NLLBMergeResources::NLLB_600M_DISTILLED)
        };

        let source_languages = NLLBLanguages::NLLB;
        let target_languages = NLLBLanguages::NLLB;

        let translation_config = TranslationConfig::new(
            ModelType::NLLB,
            model_resource,
            config_resource,
            vocab_resource,
            Some(merges_resource),
            source_languages,
            target_languages,
            Device::Cpu,
        );
        let model = TranslationModel::new(translation_config)?;

        let source_language = if speaker_language.starts_with("en-us")
            || speaker_language.starts_with("small-en-us")
        {
            Language::English
        } else if speaker_language.starts_with("cn") || speaker_language.starts_with("small-cn") {
            Language::Chinese
        } else if speaker_language.starts_with("small-ko") {
            Language::Korean
        } else if speaker_language.starts_with("fr") || speaker_language.starts_with("small-fr") {
            Language::French
        } else if speaker_language.starts_with("de") || speaker_language.starts_with("small-de") {
            Language::German
        } else if speaker_language.starts_with("ru") || speaker_language.starts_with("small-ru") {
            Language::Russian
        } else if speaker_language.starts_with("es") || speaker_language.starts_with("small-es") {
            Language::Spanish
        } else if speaker_language.starts_with("small-pt") {
            Language::Portuguese
        } else if speaker_language.starts_with("small-tr") {
            Language::Turkish
        } else if speaker_language.starts_with("vn") || speaker_language.starts_with("small-vn") {
            Language::Vietnamese
        } else if speaker_language.starts_with("it") || speaker_language.starts_with("small-it") {
            Language::Italian
        } else if speaker_language.starts_with("small-nl") {
            Language::Dutch
        } else if speaker_language.starts_with("small-ca") {
            Language::Catalan
        } else if speaker_language.starts_with("uk") || speaker_language.starts_with("small-uk") {
            Language::Ukrainian
        } else if speaker_language.starts_with("small-sv") {
            Language::Swedish
        } else if speaker_language.starts_with("hi") || speaker_language.starts_with("small-hi") {
            Language::Hindi
        } else if speaker_language.starts_with("small-cs") {
            Language::Czech
        } else if speaker_language.starts_with("small-pl") {
            Language::Polish
        } else {
            Language::Japanese
        };
        let output = model.translate(&[text], source_language, Language::Japanese)?;
        Ok(output.join(""))
    }
}
