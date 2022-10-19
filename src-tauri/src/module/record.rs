//! Run with:
//! cargo run --example read_wav <model path> <wav path>
//! e.g. "cargo run --example read_wav /home/user/stt/model /home/user/stt/test.wav"
//! (The WAV file must have signed 16-bit samples)
//!
//! Read the "Setup" section in the README to know how to link the vosk dynamic
//! libaries to the examples
use crate::BUNDLE_IDENTIFIER;

use std::{
    path::PathBuf,
    sync::{
        mpsc::{sync_channel, Receiver},
        Arc, Mutex,
    },
    thread,
};

use chrono::Local;
use cpal::{
    traits::{DeviceTrait, HostTrait, StreamTrait},
    SampleFormat,
};
use tauri::{api::path::data_dir, AppHandle};

use super::{recognizer::MyRecognizer, writer::Writer};

pub struct Record {
    app_handle: AppHandle,
}

impl Record {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    pub fn start(&self, device_label: String, stop_record_rx: Receiver<()>) {
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

        let spec = Writer::wav_spec_from_config(&config);
        let data_dir = data_dir().unwrap_or(PathBuf::from("./"));
        let audio_path = data_dir
            .join(BUNDLE_IDENTIFIER)
            .join(&format!("{}.wav", &Local::now().timestamp().to_string()));
        let writer = Arc::new(Mutex::new(Some(Writer::build(
            &audio_path.to_str().expect("error"),
            spec,
        ))));
        let writer_clone = writer.clone();
        let (notify_decoding_state_is_finalized_tx, notify_decoding_state_is_finalized_rx) =
            sync_channel(1);

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
                        notify_decoding_state_is_finalized_tx.clone(),
                    );
                    Writer::write_input_data::<f32, f32>(&data, &writer_clone);
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
                        notify_decoding_state_is_finalized_tx.clone(),
                    );
                    Writer::write_input_data::<u16, i16>(&data, &writer_clone);
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
                        notify_decoding_state_is_finalized_tx.clone(),
                    );
                    Writer::write_input_data::<i16, i16>(&data, &writer_clone);
                },
                err_fn,
            ),
        }
        .expect("Could not build stream");

        stream.play().expect("Could not play stream");
        let (stop_writer_tx, stop_writer_rx) = sync_channel(1);
        thread::spawn(move || loop {
            if notify_decoding_state_is_finalized_rx.try_recv().is_ok() {
                writer
                    .lock()
                    .unwrap()
                    .take()
                    .unwrap()
                    .finalize()
                    .expect("Error finalizing writer");
                let audio_path = data_dir
                    .join(BUNDLE_IDENTIFIER)
                    .join(&format!("{}.wav", &Local::now().timestamp().to_string()));
                writer
                    .lock()
                    .unwrap()
                    .replace(Writer::build(&audio_path.to_str().expect("error"), spec));
            }
            if stop_writer_rx.try_recv().is_ok() {
                break;
            }
        });
        stop_record_rx
            .recv()
            .expect("failed to receive the message");
        drop(stream);
        stop_writer_tx.send(()).unwrap();
    }
}
