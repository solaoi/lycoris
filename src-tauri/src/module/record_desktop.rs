//! Run with:
//! cargo run --example read_wav <model path> <wav path>
//! e.g. "cargo run --example read_wav /home/user/stt/model /home/user/stt/test.wav"
//! (The WAV file must have signed 16-bit samples)
//!
//! Read the "Setup" section in the README to know how to link the vosk dynamic
//! libaries to the examples
use crate::BUNDLE_IDENTIFIER;

use std::{
    fs::{remove_file, File},
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
use tauri::{api::path::data_dir, AppHandle, Manager};

use screencapturekit::{
    cm_sample_buffer::CMSampleBuffer,
    sc_content_filter::{InitParams, SCContentFilter},
    sc_error_handler::StreamErrorHandler,
    sc_output_handler::{SCStreamOutputType, StreamOutput},
    sc_shareable_content::SCShareableContent,
    sc_stream::SCStream,
    sc_stream_configuration::SCStreamConfiguration,
};

use vosk::Recognizer;

use super::{
    chat_online, recognizer::MyRecognizer, sqlite::Sqlite, transcription, transcription_amivoice,
    transcription_online, translation_en, translation_ja, translation_ja_high, writer::Writer,
};

pub struct RecordDesktop {
    app_handle: AppHandle,
}

struct ErrorHandler;
impl StreamErrorHandler for ErrorHandler {
    fn on_error(&self) {
        println!("Error!");
    }
}

struct StoreAudioHandler {
    app_handle: AppHandle,
    recognizer: Weak<Mutex<Recognizer>>,
    notify_decoding_state_is_finalized_tx: SyncSender<String>,
    writer_clone: Arc<Mutex<Option<(WavWriter<BufWriter<File>>, String)>>>,
    channels: u16,
}

impl StreamOutput for StoreAudioHandler {
    fn did_output_sample_buffer(&self, sample: CMSampleBuffer, _of_type: SCStreamOutputType) {
        let audio_buffers = sample.sys_ref.get_av_audio_buffer_list();
        if audio_buffers.is_err() {
            println!("Error getting audio buffer list");
        }
        let bytes = &audio_buffers.unwrap()[0].data; // 最初のチャンネルのデータを選択

        // バッファのデータを直接処理
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
        let mut current = SCShareableContent::current();
        let display = current.displays.pop().unwrap();

        let channels = 1 as u16;
        let sample_rate = 48000;
        let bits_per_sample = 32;
        let config = SCStreamConfiguration {
            width: 100,
            height: 100,
            captures_audio: true,
            sample_rate,
            channel_count: channels as u32,
            excludes_current_process_audio: true,
            ..Default::default()
        };

        let recognizer = MyRecognizer::build(
            self.app_handle.clone(),
            speaker_language.clone(),
            config.sample_rate as f32,
        );
        let recognizer_arc = Arc::new(Mutex::new(recognizer));
        let recognizer_weak = Arc::downgrade(&recognizer_arc);

        let spec = WavSpec {
            channels,
            sample_rate,
            bits_per_sample,
            sample_format: hound::SampleFormat::Float,
        };
        let data_dir = data_dir().unwrap_or(PathBuf::from("./"));
        let audio_path = data_dir.join(BUNDLE_IDENTIFIER.to_string()).join(&format!(
            "{}_desktop.wav",
            &Local::now().timestamp().to_string()
        ));
        let writer = Arc::new(Mutex::new(Some(Writer::build(
            &audio_path.to_str().expect("error"),
            spec,
        ))));
        let writer_clone = writer.clone();
        let (notify_decoding_state_is_finalized_tx, notify_decoding_state_is_finalized_rx) =
            sync_channel(1);
        let app_handle = self.app_handle.clone();
        let filter = SCContentFilter::new(InitParams::Display(display));
        let mut stream = SCStream::new(filter, config, ErrorHandler);
        stream.add_output(
            StoreAudioHandler {
                app_handle,
                recognizer: recognizer_weak,
                notify_decoding_state_is_finalized_tx,
                writer_clone,
                channels,
            },
            SCStreamOutputType::Audio,
        );
        stream.start_capture().ok();

        let app_handle = self.app_handle.clone();
        app_handle.clone().emit_all("readyToRecognize", "").unwrap();

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

                    let mut speech = Sqlite::new()
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
                        .emit_all("finalTextRecognized", speech)
                        .unwrap();

                    let audio_path = data_dir
                        .join(BUNDLE_IDENTIFIER.to_string())
                        .join(&format!("{}_desktop.wav", &now.to_string()));
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
        if stop_record_clone_tx.is_some() {
            stop_record_clone_tx.unwrap().send(()).unwrap();
        }
        stream.stop_capture().ok();
        stop_writer_tx.send(()).unwrap();
        if !is_no_transcription {
            stop_convert_tx.send(()).unwrap();
            transcription::drop_transcription();
            translation_en::drop_translation_en();
            translation_ja::drop_translation_ja();
            translation_ja_high::drop_translation_ja_high();
            transcription_online::drop_transcription_online();
            transcription_amivoice::drop_transcription_amivoice();
            chat_online::drop_chat_online();
        } else {
            drop(stop_convert_tx)
        }
    }
}
