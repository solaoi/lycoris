use vosk::{Model, Recognizer};

pub fn build() -> Recognizer {
    let model_path = "resources/vosk-model-ja-0.22";
    let model = Model::new(model_path).expect("Could not create the model");

    Recognizer::new(&model, default_sample_rate()).expect("Could not create the recognizer")
}

pub fn default_sample_rate() -> f32 {
    16000.0
}
