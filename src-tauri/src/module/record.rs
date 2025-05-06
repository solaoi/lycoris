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
use tauri::{AppHandle, Emitter, Manager};

use super::{
    chat_online, recognizer::MyRecognizer, sqlite::Sqlite, transcription, transcription_amivoice,
    transcription_hybrid, transcription_ja, transcription_online, translation_en, translation_ja,
    translation_ja_high, writer::Writer,
};

pub struct Record {
    app_handle: AppHandle,
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

        let spec = Writer::wav_spec_from_config(&config);
        let data_dir = self.app_handle.path().data_dir().unwrap_or(PathBuf::from("./"));
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
                        &mut recognizer_clone.lock().unwrap(),
                        data,
                        channels,
                        notify_decoding_state_is_finalized_tx.clone(),
                        false,
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
                        &mut recognizer_clone.lock().unwrap(),
                        data,
                        channels,
                        notify_decoding_state_is_finalized_tx.clone(),
                        false,
                    );
                    Writer::write_input_data::<u16, f32>(&data, &writer_clone);
                },
                err_fn,
            ),
            SampleFormat::I16 => device.build_input_stream(
                &config.into(),
                move |data: &[i16], _| {
                    MyRecognizer::recognize(
                        app_handle.clone(),
                        &mut recognizer_clone.lock().unwrap(),
                        data,
                        channels,
                        notify_decoding_state_is_finalized_tx.clone(),
                        false,
                    );
                    Writer::write_input_data::<i16, f32>(&data, &writer_clone);
                },
                err_fn,
            ),
        }
        .expect("Could not build stream");

        stream.play().expect("Could not play stream");

        let app_handle = self.app_handle.clone();
        app_handle.clone().emit("readyToRecognize", "").unwrap();

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

                    let speech = Sqlite::new(app_handle.clone()).save_speech(
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
                        .emit("finalTextRecognized", speech.unwrap())
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
                                transcription_online::initialize_transcription_online(
                                    app_handle_clone,
                                    transcription_accuracy_clone,
                                    speaker_language_clone,
                                    note_id,
                                );
                                let mut lock =
                                    transcription_online::SINGLETON_INSTANCE.lock().unwrap();
                                if let Some(singleton) = lock.as_mut() {
                                    singleton.start(stop_convert_rx_clone, false);
                                }
                            } else if transcription_accuracy_clone.starts_with("online-amivoice") {
                                transcription_amivoice::initialize_transcription_amivoice(
                                    app_handle_clone,
                                    note_id,
                                );
                                let mut lock =
                                    transcription_amivoice::SINGLETON_INSTANCE.lock().unwrap();
                                if let Some(singleton) = lock.as_mut() {
                                    singleton.start(stop_convert_rx_clone, false);
                                }
                            } else if transcription_accuracy_clone.starts_with("online-chat") {
                                chat_online::initialize_chat_online(
                                    app_handle_clone,
                                    speaker_language_clone,
                                    note_id,
                                );
                                let mut lock = chat_online::SINGLETON_INSTANCE.lock().unwrap();
                                if let Some(singleton) = lock.as_mut() {
                                    singleton.start(stop_convert_rx_clone, false);
                                }
                            } else if transcription_accuracy_clone.starts_with("fugumt-en-ja") {
                                translation_ja::initialize_translation_ja(
                                    app_handle_clone,
                                    speaker_language_clone,
                                    note_id,
                                );
                                let mut lock = translation_ja::SINGLETON_INSTANCE.lock().unwrap();
                                if let Some(singleton) = lock.as_mut() {
                                    singleton.start(stop_convert_rx_clone, false);
                                }
                            } else if transcription_accuracy_clone.starts_with("fugumt-ja-en") {
                                translation_en::initialize_translation_en(
                                    app_handle_clone,
                                    note_id,
                                );
                                let mut lock = translation_en::SINGLETON_INSTANCE.lock().unwrap();
                                if let Some(singleton) = lock.as_mut() {
                                    singleton.start(stop_convert_rx_clone, false);
                                }
                            } else if transcription_accuracy_clone.starts_with("honyaku-13b") {
                                translation_ja_high::initialize_translation_ja_high(
                                    app_handle_clone,
                                    speaker_language_clone,
                                    note_id,
                                );
                                let mut lock =
                                    translation_ja_high::SINGLETON_INSTANCE.lock().unwrap();
                                if let Some(singleton) = lock.as_mut() {
                                    singleton.start(stop_convert_rx_clone, false);
                                }
                            } else if transcription_accuracy_clone.starts_with("reazonspeech") {
                                transcription_ja::initialize_transcription_ja(
                                    app_handle_clone,
                                    note_id,
                                );
                                let mut lock = transcription_ja::SINGLETON_INSTANCE.lock().unwrap();
                                if let Some(singleton) = lock.as_mut() {
                                    singleton.start(stop_convert_rx_clone, false);
                                }
                            } else if transcription_accuracy_clone.starts_with("hybrid-transcript")
                            {
                                transcription_hybrid::initialize_transcription_hybrid(
                                    app_handle_clone,
                                    note_id,
                                );
                                let mut lock =
                                    transcription_hybrid::SINGLETON_INSTANCE.lock().unwrap();
                                if let Some(singleton) = lock.as_mut() {
                                    singleton.start(stop_convert_rx_clone, false);
                                }
                            } else {
                                transcription::initialize_transcription(
                                    app_handle_clone,
                                    transcription_accuracy_clone,
                                    speaker_language_clone,
                                    note_id,
                                );
                                let mut lock = transcription::SINGLETON_INSTANCE.lock().unwrap();
                                if let Some(singleton) = lock.as_mut() {
                                    singleton.start(stop_convert_rx_clone, false);
                                }
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
            transcription::drop_transcription();
            transcription_ja::drop_transcription_ja();
            translation_en::drop_translation_en();
            translation_ja::drop_translation_ja();
            translation_ja_high::drop_translation_ja_high();
            transcription_online::drop_transcription_online();
            transcription_amivoice::drop_transcription_amivoice();
            transcription_hybrid::drop_transcription_hybrid();
            chat_online::drop_chat_online();
        } else {
            drop(stop_convert_tx)
        }
    }
}
