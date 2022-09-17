//! Run with:
//! cargo run --example read_wav <model path> <wav path>
//! e.g. "cargo run --example read_wav /home/user/stt/model /home/user/stt/test.wav"
//! (The WAV file must have signed 16-bit samples)
//!
//! Read the "Setup" section in the README to know how to link the vosk dynamic
//! libaries to the examples

use std::{sync::mpsc::Receiver, time::Duration};

use portaudio_rs::stream::{Stream, StreamCallbackResult, StreamFlags, StreamParameters};
use tauri::{AppHandle, Manager};
use unicode_segmentation::UnicodeSegmentation;
use vosk::DecodingState;

use super::{device, recognizer};

pub struct Record {
    app_handle: AppHandle,
}

impl Record {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    pub fn start(&self, device_id: u32, receiver: Receiver<()>) {
        let mut suggested_latency = Duration::ZERO;
        for device in device::list_devices().unwrap() {
            if device.device_id == device_id {
                suggested_latency = device.latency;
                break;
            }
        }
        let input_par = StreamParameters {
            device: device_id,
            channel_count: 1,
            suggested_latency,
            data: 42, // random
        };
        let mut last_partial = String::new();
        let mut recognizer = recognizer::build();
        let stream = Stream::open(
            Some(input_par),                          // input channels
            None,                                     // output channels
            recognizer::default_sample_rate() as f64, // sample rate
            portaudio_rs::stream::FRAMES_PER_BUFFER_UNSPECIFIED,
            StreamFlags::empty(),
            Some(Box::new(move |input, _out: &mut [i16], _time, _flags| {
                let state = recognizer.accept_waveform(input);
                match state {
                    DecodingState::Running => {
                        let result = recognizer.partial_result();
                        if Self::is_correct_words(result.partial) && result.partial != last_partial
                        {
                            last_partial.clear();
                            last_partial.insert_str(0, &result.partial);
                            if !result.partial.is_empty() {
                                self.app_handle
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
                                self.app_handle
                                    .emit_all("finalTextRecognized", text.replace(" ", ""))
                                    .unwrap();
                            }
                        }
                    }
                    _ => {}
                }
                StreamCallbackResult::Continue
            })),
        )
        .unwrap();
        stream.start().expect("failed to start the stream");
        receiver.recv().expect("failed to receive the message")
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
}
