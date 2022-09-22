use tauri::AppHandle;
use vosk::{Model, Recognizer};

pub fn build(app_handle: AppHandle) -> Recognizer {
    let model_path = app_handle
        .path_resolver()
        .resolve_resource("resources/vosk-model-ja-0.22")
        .unwrap()
        .to_string_lossy()
        .to_string();
    let model = Model::new(model_path).expect("Could not create the model");

    Recognizer::new(&model, default_sample_rate()).expect("Could not create the recognizer")
}

pub fn default_sample_rate() -> f32 {
    16000.0
}
