use std::fs;

use sbv2_core::tts::TTSModelHolder;
use tauri::{path::BaseDirectory, AppHandle, Manager};

pub fn list_models(app_handle: AppHandle) -> Vec<String> {
    let models_path = app_handle
        .path()
        .resolve(
            format!("resources/style-bert-vits/models"),
            BaseDirectory::Resource,
        )
        .unwrap()
        .to_string_lossy()
        .to_string();

    let dir = fs::read_dir(models_path).unwrap();
    let mut models: Vec<String> = Vec::new();
    for item in dir.into_iter() {
        let name = item.unwrap().file_name().to_string_lossy().to_string();
        if name.ends_with(".sbv2") {
            let entry = &name[..name.len() - 5];
            models.push(entry.to_string());
        }
    }

    models
}

pub struct Synthesizer {
    ident: String,
    tts_model: TTSModelHolder,
}

impl Synthesizer {
    pub fn new(app_handle: AppHandle, model: String) -> Self {
        let bert_model_path = app_handle
            .path()
            .resolve(format!("resources/style-bert-vits/{}", "deberta.onnx"), BaseDirectory::Resource)
            .unwrap()
            .to_string_lossy()
            .to_string();
        let tokenizer_path = app_handle
            .path()
            .resolve(
                format!("resources/style-bert-vits/{}", "tokenizer.json"),
                BaseDirectory::Resource,
            )
            .unwrap()
            .to_string_lossy()
            .to_string();
        let models_path = app_handle
            .path()
            .resolve(
                format!("resources/style-bert-vits/models"),
                BaseDirectory::Resource,
            )
            .unwrap()
            .to_string_lossy()
            .to_string();

        let mut tts_model = TTSModelHolder::new(
            &fs::read(bert_model_path).unwrap(),
            &fs::read(tokenizer_path).unwrap(),
        )
        .unwrap();

        let sbv2_bytes = fs::read(format!("{models_path}/{}.sbv2", model.clone())).unwrap();
        let _ = tts_model.load_sbv2file(model.clone(), sbv2_bytes);

        Self {
            ident: model,
            tts_model,
        }
    }

    pub fn synthesize(
        &mut self,
        text: String,
        sdp_ratio: f32,
        length_scale: f32,
    ) -> Result<Vec<u8>, String> {
        let (bert_ori, phones, tones, lang_ids) = self.tts_model.parse_text(&text).unwrap();

        let style_vector = self
            .tts_model
            .get_style_vector(self.ident.clone(), 0, 1.0)
            .unwrap();
        let buffer = self
            .tts_model
            .synthesize(
                self.ident.clone(),
                bert_ori.to_owned(),
                phones,
                tones,
                lang_ids,
                style_vector,
                sdp_ratio,
                length_scale,
            )
            .unwrap();

        Ok(buffer)
    }
}
