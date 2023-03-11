use std::sync::mpsc::SyncSender;

use cpal::ChannelCount;
use dasp::{sample::ToSample, Sample};
use tauri::{AppHandle, Manager};
use unicode_segmentation::UnicodeSegmentation;
use vosk::{DecodingState, Model, Recognizer};

pub struct MyRecognizer {}

impl MyRecognizer {
    pub fn build(app_handle: AppHandle, speaker_language: String, sample_rate: f32) -> Recognizer {
        let model_path = app_handle
            .path_resolver()
            .resolve_resource(format!("resources/vosk-model-{}", speaker_language))
            .unwrap()
            .to_string_lossy()
            .to_string();
        let model = Model::new(model_path).expect("Could not create the model");

        Recognizer::new(&model, sample_rate).expect("Could not create the recognizer")
    }

    pub fn recognize<T: Sample + ToSample<i16>>(
        app_handle: AppHandle,
        last_partial: &mut String,
        recognizer: &mut Recognizer,
        data: &[T],
        channels: ChannelCount,
        notify_decoding_state_is_finalized_tx: SyncSender<String>,
    ) {
        let data: Vec<i16> = data.iter().map(|v| v.to_sample()).collect();
        let data = if channels != 1 {
            Self::stereo_to_mono(&data)
        } else {
            data
        };

        let state = recognizer.accept_waveform(&data);
        match state {
            DecodingState::Running => {
                let result = recognizer.partial_result();
                if Self::is_correct_words(result.partial) && result.partial != last_partial {
                    last_partial.clear();
                    last_partial.insert_str(0, &result.partial);
                    if !result.partial.is_empty() {
                        app_handle
                            .emit_all("partialTextRecognized", result.partial)
                            .unwrap();
                    }
                }
            }
            DecodingState::Finalized => {
                let result = recognizer.final_result().single();
                if result.is_some() {
                    let text = result.unwrap().text;
                    if Self::is_correct_words(text) {
                        notify_decoding_state_is_finalized_tx
                            .send(text.to_string())
                            .unwrap();
                    }
                }
            }
            DecodingState::Failed => eprintln!("DecodingState error"),
        }
    }

    fn is_correct_words(words: &str) -> bool {
        let g = words.graphemes(true).collect::<Vec<&str>>();
        let count = g.len();
        if count < 2 {
            return false;
        }
        if count == 2 && g[1] == "ー" {
            return false;
        }
        true
    }

    fn stereo_to_mono(input_data: &[i16]) -> Vec<i16> {
        let mut result = Vec::with_capacity(input_data.len() / 2);
        result.extend(
            input_data
                .chunks_exact(2)
                .map(|chunk| chunk[0] / 2 + chunk[1] / 2),
        );

        result
    }
}
