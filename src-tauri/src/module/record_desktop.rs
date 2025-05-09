use crate::BUNDLE_IDENTIFIER;

use std::{
    fs::remove_file,
    io::BufWriter,
    option::Option,
    path::PathBuf,
    string::String,
    sync::{
        mpsc::{sync_channel, SyncSender},
        Arc, Mutex, Weak,
    },
    thread,
};

use chrono::Local;
use crossbeam_channel::{unbounded, Receiver, Sender};
use hound::{WavSpec, WavWriter};
use tauri::{AppHandle, Emitter, Manager};

use core_media_rs::cm_sample_buffer::CMSampleBuffer;
use screencapturekit::{
    shareable_content::SCShareableContent,
    stream::{
        configuration::SCStreamConfiguration, content_filter::SCContentFilter,
        output_trait::SCStreamOutputTrait, output_type::SCStreamOutputType, SCStream,
    },
};

use vosk::Recognizer;

use super::{
    chat_online, recognizer::MyRecognizer, sqlite::Sqlite, transcription, transcription_amivoice,
    transcription_hybrid, transcription_ja, transcription_online, translation_en, translation_ja,
    translation_ja_high, writer::Writer,
};

pub struct RecordDesktop {
    app_handle: AppHandle,
}

struct StoreAudioHandler {
    app_handle: AppHandle,
    recognizer: Weak<Mutex<Recognizer>>,
    notify_decoding_state_is_finalized_tx: SyncSender<String>,
    writer_clone: Arc<Mutex<Option<(WavWriter<BufWriter<std::fs::File>>, String)>>>,
    channels: u16,
}

impl SCStreamOutputTrait for StoreAudioHandler {
    fn did_output_sample_buffer(&self, sample: CMSampleBuffer, _of_type: SCStreamOutputType) {
        let audio_buffers = sample.get_audio_buffer_list();
        if audio_buffers.is_err() {
            println!("Error getting audio buffer list");
            return;
        }
        if let Some(buffer) = audio_buffers.unwrap().get(0) {
            let bytes = &buffer.data();

            // バッファのデータを f32 に変換
            let samples: Vec<f32> = bytes
                .chunks_exact(4)
                .map(|chunk| f32::from_le_bytes(chunk.try_into().unwrap()))
                .collect();

            if let Some(recognizer) = self.recognizer.upgrade() {
                MyRecognizer::recognize(
                    self.app_handle.clone(),
                    &mut recognizer.lock().unwrap(),
                    &samples,
                    self.channels,
                    self.notify_decoding_state_is_finalized_tx.clone(),
                    true,
                );
            }

            Writer::write_input_data::<f32, f32>(&samples, &self.writer_clone);
        }
    }
}

impl RecordDesktop {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    pub fn start(
        &self,
        speaker_language: String,
        transcription_accuracy: String,
        note_id: u64,
        stop_record_rx: Receiver<()>,
        stop_record_clone_tx: Option<Sender<()>>,
    ) {
        let display = SCShareableContent::get().unwrap().displays().remove(0);

        let channels = 1_u8;
        let sample_rate = 48000;
        let bits_per_sample = 32;
        let config = SCStreamConfiguration::new()
            .set_captures_audio(true)
            .unwrap()
            .set_channel_count(channels)
            .unwrap();

        let recognizer = MyRecognizer::build(
            self.app_handle.clone(),
            speaker_language.clone(),
            sample_rate as f32,
        );
        let recognizer_arc = Arc::new(Mutex::new(recognizer));
        let recognizer_weak = Arc::downgrade(&recognizer_arc);

        let spec = WavSpec {
            channels: channels as u16,
            sample_rate,
            bits_per_sample,
            sample_format: hound::SampleFormat::Float,
        };
        let data_dir = self
            .app_handle
            .path()
            .data_dir()
            .unwrap_or(PathBuf::from("./"));
        let audio_path = data_dir.join(BUNDLE_IDENTIFIER.to_string()).join(&format!(
            "{}_desktop.wav",
            &Local::now().timestamp().to_string()
        ));
        let writer = Arc::new(Mutex::new(Some(Writer::build(
            audio_path.to_str().expect("error"),
            spec,
        ))));
        let writer_clone = writer.clone();
        let (notify_decoding_state_is_finalized_tx, notify_decoding_state_is_finalized_rx) =
            sync_channel(1);
        let filter = SCContentFilter::new().with_display_excluding_windows(&display, &[]);
        let mut stream = SCStream::new(&filter, &config);
        stream.add_output_handler(
            StoreAudioHandler {
                app_handle: self.app_handle.clone(),
                recognizer: recognizer_weak,
                notify_decoding_state_is_finalized_tx,
                writer_clone,
                channels: channels as u16,
            },
            SCStreamOutputType::Audio,
        );
        stream.start_capture().ok();

        self.app_handle
            .clone()
            .emit("readyToRecognize", "")
            .unwrap();

        let (stop_writer_tx, stop_writer_rx) = sync_channel(1);
        let is_converting = Arc::new(Mutex::new(false));
        let (stop_convert_tx, stop_convert_rx) = unbounded();
        let is_no_transcription = transcription_accuracy == "off";
        let app_handle = self.app_handle.clone();

        {
            let app_handle = app_handle.clone();
            let data_dir = data_dir.clone();
            let is_converting = is_converting.clone();
            let speaker_language = speaker_language.clone();
            let transcription_accuracy = transcription_accuracy.clone();
            let stop_convert_rx = stop_convert_rx.clone();

            let writer_for_thread = writer.clone();

            thread::spawn(move || loop {
                match notify_decoding_state_is_finalized_rx.try_recv() {
                    Ok(mut text) => {
                        let maybe_writer = {
                            let mut guard = writer_for_thread.lock().unwrap();
                            guard.take()
                        };

                        if let Some((w, path)) = maybe_writer {
                            w.finalize().expect("Error finalizing writer");

                            let now = Local::now().timestamp();
                            if speaker_language.starts_with("ja")
                                || speaker_language.starts_with("small-ja")
                            {
                                text = text.replace(" ", "");
                            }

                            let mut speech = Sqlite::new(app_handle.clone())
                                .save_speech(
                                    "speech".to_string(),
                                    now as u64,
                                    text,
                                    path,
                                    "vosk".to_string(),
                                    speaker_language.clone(),
                                    note_id,
                                )
                                .unwrap();
                            speech.is_desktop = true;

                            app_handle
                                .clone()
                                .emit("finalTextRecognized", speech)
                                .unwrap();

                            let audio_path = data_dir
                                .join(BUNDLE_IDENTIFIER.to_string())
                                .join(&format!("{}_desktop.wav", &now.to_string()));
                            let mut guard = writer_for_thread.lock().unwrap();
                            guard
                                .replace(Writer::build(&audio_path.to_str().expect("error"), spec));
                        }
                        if !is_no_transcription && !*is_converting.lock().unwrap() {
                            let is_converting_clone = Arc::clone(&is_converting);
                            let app_handle_clone = app_handle.clone();
                            let stop_convert_rx_clone = stop_convert_rx.clone();
                            let transcription_accuracy_clone = transcription_accuracy.clone();
                            let speaker_language_clone = speaker_language.clone();

                            std::thread::spawn(move || {
                                {
                                    let mut lock = is_converting_clone.lock().unwrap();
                                    *lock = true;
                                }

                                if transcription_accuracy_clone.starts_with("online-transcript") {
                                    transcription_online::initialize_transcription_online(
                                        app_handle_clone.clone(),
                                        transcription_accuracy_clone.clone(),
                                        speaker_language_clone.clone(),
                                        note_id,
                                    );
                                    let mut lock =
                                        transcription_online::SINGLETON_INSTANCE.lock().unwrap();
                                    if let Some(singleton) = lock.as_mut() {
                                        singleton.start(stop_convert_rx_clone, false);
                                    }
                                } else if transcription_accuracy_clone
                                    .starts_with("online-amivoice")
                                {
                                    transcription_amivoice::initialize_transcription_amivoice(
                                        app_handle_clone.clone(),
                                        note_id,
                                    );
                                    let mut lock =
                                        transcription_amivoice::SINGLETON_INSTANCE.lock().unwrap();
                                    if let Some(singleton) = lock.as_mut() {
                                        singleton.start(stop_convert_rx_clone, false);
                                    }
                                } else if transcription_accuracy_clone.starts_with("online-chat") {
                                    chat_online::initialize_chat_online(
                                        app_handle_clone.clone(),
                                        speaker_language_clone.clone(),
                                        note_id,
                                    );
                                    let mut lock = chat_online::SINGLETON_INSTANCE.lock().unwrap();
                                    if let Some(singleton) = lock.as_mut() {
                                        singleton.start(stop_convert_rx_clone, false);
                                    }
                                } else if transcription_accuracy_clone.starts_with("fugumt-en-ja") {
                                    translation_ja::initialize_translation_ja(
                                        app_handle_clone.clone(),
                                        speaker_language_clone.clone(),
                                        note_id,
                                    );
                                    let mut lock =
                                        translation_ja::SINGLETON_INSTANCE.lock().unwrap();
                                    if let Some(singleton) = lock.as_mut() {
                                        singleton.start(stop_convert_rx_clone, false);
                                    }
                                } else if transcription_accuracy_clone.starts_with("fugumt-ja-en") {
                                    translation_en::initialize_translation_en(
                                        app_handle_clone.clone(),
                                        note_id,
                                    );
                                    let mut lock =
                                        translation_en::SINGLETON_INSTANCE.lock().unwrap();
                                    if let Some(singleton) = lock.as_mut() {
                                        singleton.start(stop_convert_rx_clone, false);
                                    }
                                } else if transcription_accuracy_clone.starts_with("honyaku-13b") {
                                    translation_ja_high::initialize_translation_ja_high(
                                        app_handle_clone.clone(),
                                        speaker_language_clone.clone(),
                                        note_id,
                                    );
                                    let mut lock =
                                        translation_ja_high::SINGLETON_INSTANCE.lock().unwrap();
                                    if let Some(singleton) = lock.as_mut() {
                                        singleton.start(stop_convert_rx_clone, false);
                                    }
                                } else if transcription_accuracy_clone.starts_with("reazonspeech") {
                                    transcription_ja::initialize_transcription_ja(
                                        app_handle_clone.clone(),
                                        note_id,
                                    );
                                    let mut lock =
                                        transcription_ja::SINGLETON_INSTANCE.lock().unwrap();
                                    if let Some(singleton) = lock.as_mut() {
                                        singleton.start(stop_convert_rx_clone, false);
                                    }
                                } else if transcription_accuracy_clone
                                    .starts_with("hybrid-transcript")
                                {
                                    transcription_hybrid::initialize_transcription_hybrid(
                                        app_handle_clone.clone(),
                                        note_id,
                                    );
                                    let mut lock =
                                        transcription_hybrid::SINGLETON_INSTANCE.lock().unwrap();
                                    if let Some(singleton) = lock.as_mut() {
                                        singleton.start(stop_convert_rx_clone, false);
                                    }
                                } else {
                                    transcription::initialize_transcription(
                                        app_handle_clone.clone(),
                                        transcription_accuracy_clone,
                                        speaker_language_clone,
                                        note_id,
                                    );
                                    let mut lock =
                                        transcription::SINGLETON_INSTANCE.lock().unwrap();
                                    if let Some(singleton) = lock.as_mut() {
                                        singleton.start(stop_convert_rx_clone, false);
                                    }
                                }

                                {
                                    let mut lock = is_converting_clone.lock().unwrap();
                                    *lock = false;
                                }
                            });
                        }
                    }
                    _ => (),
                }
                if stop_writer_rx.try_recv().is_ok() {
                    let maybe_writer = {
                        let mut guard = writer_for_thread.lock().unwrap();
                        guard.take()
                    };
                    if let Some((w, path)) = maybe_writer {
                        drop(w);
                        remove_file(path).ok();
                    }
                    break;
                }
            });
        }
        stop_record_rx
            .recv()
            .expect("failed to receive the message");
        if let Some(tx) = stop_record_clone_tx {
            tx.send(()).ok();
        }
        stream.stop_capture().ok();
        stop_writer_tx.send(()).ok();

        if !is_no_transcription {
            stop_convert_tx.send(()).ok();
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
