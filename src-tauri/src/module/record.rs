//! Run with:
//! cargo run --example read_wav <model path> <wav path>
//! e.g. "cargo run --example read_wav /home/user/stt/model /home/user/stt/test.wav"
//! (The WAV file must have signed 16-bit samples)
//!
//! Read the "Setup" section in the README to know how to link the vosk dynamic
//! libaries to the examples

use std::sync::{mpsc::Receiver, Arc, Mutex};

use cpal::{
    traits::{DeviceTrait, HostTrait, StreamTrait},
    SampleFormat,
};
use tauri::AppHandle;

use super::recognizer::MyRecognizer;

pub struct Record {
    app_handle: AppHandle,
}

impl Record {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    pub fn start(&self, device_label: String, receiver: Receiver<()>) {
        let host = cpal::default_host();
        let device = host
            .input_devices()
            .unwrap()
            .find(|device| device.name().ok().unwrap() == device_label)
            .unwrap();
        let config = device
            .default_input_config()
            .expect("Failed to load default input config");
        let channels = config.channels();

        let err_fn = move |err| {
            eprintln!("an error occurred on stream: {}", err);
        };

        let app_handle = self.app_handle.clone();
        let recognizer = MyRecognizer::build(app_handle.clone(), config.sample_rate().0 as f32);
        let recognizer = Arc::new(Mutex::new(recognizer));
        let recognizer_clone = recognizer.clone();
        let mut last_partial = String::new();

        let stream = match config.sample_format() {
            SampleFormat::F32 => device.build_input_stream(
                &config.into(),
                move |data: &[f32], _| {
                    MyRecognizer::recognize(
                        app_handle.clone(),
                        &mut last_partial,
                        &mut recognizer_clone.lock().unwrap(),
                        data,
                        channels,
                    )
                },
                err_fn,
            ),
            SampleFormat::U16 => device.build_input_stream(
                &config.into(),
                move |data: &[u16], _| {
                    MyRecognizer::recognize(
                        app_handle.clone(),
                        &mut last_partial,
                        &mut recognizer_clone.lock().unwrap(),
                        data,
                        channels,
                    )
                },
                err_fn,
            ),
            SampleFormat::I16 => device.build_input_stream(
                &config.into(),
                move |data: &[i16], _| {
                    MyRecognizer::recognize(
                        app_handle.clone(),
                        &mut last_partial,
                        &mut recognizer_clone.lock().unwrap(),
                        data,
                        channels,
                    )
                },
                err_fn,
            ),
        }
        .expect("Could not build stream");

        stream.play().expect("Could not play stream");
        receiver.recv().expect("failed to receive the message");
        drop(stream);
    }
}
