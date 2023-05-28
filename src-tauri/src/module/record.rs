//! Run with:
//! cargo run --example read_wav <model path> <wav path>
//! e.g. "cargo run --example read_wav /home/user/stt/model /home/user/stt/test.wav"
//! (The WAV file must have signed 16-bit samples)
//!
//! Read the "Setup" section in the README to know how to link the vosk dynamic
//! libaries to the examples
use crate::BUNDLE_IDENTIFIER;

use std::{
    fs::remove_file,
    path::PathBuf,
    sync::{mpsc::sync_channel, Arc, Mutex},
    thread,
};

use chrono::Local;
use cpal::{
    traits::{DeviceTrait, HostTrait, StreamTrait},
    SampleFormat,
};
use crossbeam_channel::{unbounded, Receiver};
use tauri::{api::path::data_dir, AppHandle, Manager};

use super::{
    chat_online::ChatOnline, recognizer::MyRecognizer, sqlite::Sqlite,
    transcription::Transcription, transcription_online::TranscriptionOnline, writer::Writer,
};

pub struct Record {
    app_handle: AppHandle,
}
#[derive(Clone, serde::Serialize)]
struct Payload {
    text: String,
    wav: String,
}

impl Record {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    pub fn start(
        &self,
        device_label: String,
        speaker_language: String,
        transcription_accuracy: String,
        note_id: u64,
        stop_record_rx: Receiver<()>,
    ) {
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

        let recognizer = MyRecognizer::build(
            self.app_handle.clone(),
            speaker_language.clone(),
            config.sample_rate().0 as f32,
        );
        let recognizer = Arc::new(Mutex::new(recognizer));
        let recognizer_clone = recognizer.clone();
        let mut last_partial = String::new();

        let spec = Writer::wav_spec_from_config(&config);
        let data_dir = data_dir().unwrap_or(PathBuf::from("./"));
        let audio_path = data_dir
            .join(BUNDLE_IDENTIFIER.to_string())
            .join(&format!("{}.wav", &Local::now().timestamp().to_string()));
        let writer = Arc::new(Mutex::new(Some(Writer::build(
            &audio_path.to_str().expect("error"),
            spec,
        ))));
        let writer_clone = writer.clone();
        let (notify_decoding_state_is_finalized_tx, notify_decoding_state_is_finalized_rx) =
            sync_channel(1);
        let app_handle = self.app_handle.clone();

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
        let is_converting = Arc::new(Mutex::new(false));
        let (stop_convert_tx, stop_convert_rx) = unbounded();
        let is_no_transcription = transcription_accuracy == "off";
        let app_handle = self.app_handle.clone();
        thread::spawn(move || loop {
            match notify_decoding_state_is_finalized_rx.try_recv() {
                Ok(mut text) => {
                    let (w, path) = writer.lock().unwrap().take().unwrap();
                    w.finalize().expect("Error finalizing writer");

                    let now = Local::now().timestamp();
                    if speaker_language.starts_with("ja")
                        || speaker_language.starts_with("small-ja")
                    {
                        text = text.replace(" ", "");
                    }

                    let speech = Sqlite::new().save_speech(
                        "speech".to_string(),
                        now as u64,
                        text,
                        path,
                        "vosk".to_string(),
                        speaker_language.clone(),
                        note_id,
                    );

                    app_handle
                        .clone()
                        .emit_all("finalTextRecognized", speech.unwrap())
                        .unwrap();

                    let audio_path = data_dir
                        .join(BUNDLE_IDENTIFIER.to_string())
                        .join(&format!("{}.wav", &now.to_string()));
                    writer
                        .lock()
                        .unwrap()
                        .replace(Writer::build(&audio_path.to_str().expect("error"), spec));
                    if !is_no_transcription && !*is_converting.lock().unwrap() {
                        let is_converting_clone = Arc::clone(&is_converting);
                        let app_handle_clone = app_handle.clone();
                        let stop_convert_rx_clone = stop_convert_rx.clone();
                        let transcription_accuracy_clone = transcription_accuracy.clone();
                        let speaker_language_clone = speaker_language.clone();
                        std::thread::spawn(move || {
                            let mut lock = is_converting_clone.lock().unwrap();
                            *lock = true;
                            drop(lock);
                            if transcription_accuracy_clone.starts_with("online-transcript") {
                                let mut transcription_online = TranscriptionOnline::new(
                                    app_handle_clone,
                                    transcription_accuracy_clone,
                                    speaker_language_clone,
                                    note_id,
                                );
                                transcription_online.start(stop_convert_rx_clone, false);
                            } else if transcription_accuracy_clone.starts_with("online-chat") {
                                let mut chat_online = ChatOnline::new(
                                    app_handle_clone,
                                    speaker_language_clone,
                                    note_id,
                                );
                                chat_online.start(stop_convert_rx_clone, false);
                            } else {
                                let mut transcription = Transcription::new(
                                    app_handle_clone,
                                    transcription_accuracy_clone,
                                    speaker_language_clone,
                                    note_id,
                                );
                                transcription.start(stop_convert_rx_clone, false);
                            }

                            let mut lock = is_converting_clone.lock().unwrap();
                            *lock = false;
                            drop(lock);
                        });
                    };
                }
                _ => (),
            }
            if stop_writer_rx.try_recv().is_ok() {
                let (w, path) = writer.lock().unwrap().take().unwrap();
                drop(w);
                remove_file(path).unwrap();
                break;
            }
        });
        stop_record_rx
            .recv()
            .expect("failed to receive the message");
        drop(stream);
        stop_writer_tx.send(()).unwrap();
        if !is_no_transcription {
            stop_convert_tx.send(()).unwrap();
        } else {
            drop(stop_convert_tx)
        }
    }
}
