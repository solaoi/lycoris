use std::sync::mpsc::SyncSender;

use cpal::ChannelCount;
use dasp::{sample::ToSample, Sample};
use tauri::{path::BaseDirectory, AppHandle, Emitter, Manager};
use unicode_segmentation::UnicodeSegmentation;
use vosk::{DecodingState, Model, Recognizer};

#[derive(Clone, serde::Serialize)]
struct PartialText {
    content: String,
    is_desktop: bool,
}

pub struct MyRecognizer {}

impl MyRecognizer {
    pub fn build(app_handle: AppHandle, speaker_language: String, sample_rate: f32) -> Recognizer {
        let model_path = app_handle
            .path()
            .resolve(
                format!("resources/vosk-model-{}", speaker_language),
                BaseDirectory::Resource,
            )
            .unwrap()
            .to_string_lossy()
            .to_string();
        let model = Model::new(model_path).expect("Could not create the model");

        Recognizer::new(&model, sample_rate).expect("Could not create the recognizer")
    }

    pub fn recognize<T: Sample + ToSample<i16>>(
        app_handle: AppHandle,
        recognizer: &mut Recognizer,
        data: &[T],
        channels: ChannelCount,
        notify_decoding_state_is_finalized_tx: SyncSender<String>,
        is_desktop: bool,
    ) {
        let mut last_partial = String::new();
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
                            .emit(
                                "partialTextRecognized",
                                PartialText {
                                    content: result.partial.to_string(),
                                    is_desktop,
                                },
                            )
                            .unwrap();
                    }
                }
            }
            DecodingState::Finalized => {
                let result = recognizer.final_result().single();
                if result.is_some() {
                    let text = result.unwrap().text;
                    if Self::is_correct_words(text) {
                        if let Err(e) = notify_decoding_state_is_finalized_tx.send(text.to_string())
                        {
                            eprintln!("Failed to send final recognized text: {:?}", e);
                        }
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
