use super::{transcription_hybrid_online, transcription_hybrid_reazonspeech, transcription_hybrid_whisper};

use crossbeam_channel::Receiver;
use std::{sync::Mutex, thread};
use tauri::AppHandle;

#[derive(Debug, Clone, serde::Serialize)]
pub struct TraceCompletion {}

pub struct TranscriptionHybrid {
    app_handle: AppHandle,
    note_id: u64,
}

impl TranscriptionHybrid {
    pub fn new(app_handle: AppHandle, note_id: u64) -> Self {
        TranscriptionHybrid {
            app_handle,
            note_id,
        }
    }

    pub fn start(&mut self, stop_convert_rx: Receiver<()>, use_no_vosk_queue_terminate_mode: bool) {
        let note_id = self.note_id;

        let app_handle_clone_for_reazonspeech = self.app_handle.clone();
        let app_handle_clone_for_whisper = self.app_handle.clone();

        let stop_convert_rx_clone_for_reazonspeech = stop_convert_rx.clone();
        let stop_convert_rx_clone_for_whisper = stop_convert_rx.clone();

        thread::spawn(move || {
            transcription_hybrid_reazonspeech::initialize_transcription_hybrid_reazonspeech(
                app_handle_clone_for_reazonspeech,
                note_id,
            );
            let mut lock = transcription_hybrid_reazonspeech::SINGLETON_INSTANCE
                .lock()
                .unwrap();
            if let Some(singleton) = lock.as_mut() {
                singleton.start(stop_convert_rx_clone_for_reazonspeech, use_no_vosk_queue_terminate_mode);
            }
        });

        thread::spawn(move || {
            transcription_hybrid_whisper::initialize_transcription_hybrid_whisper(
                app_handle_clone_for_whisper,
                note_id,
            );
            let mut lock = transcription_hybrid_whisper::SINGLETON_INSTANCE
                .lock()
                .unwrap();
            if let Some(singleton) = lock.as_mut() {
                singleton.start(stop_convert_rx_clone_for_whisper, use_no_vosk_queue_terminate_mode);
            }
        });
    }
}

pub static SINGLETON_INSTANCE: Mutex<Option<TranscriptionHybrid>> = Mutex::new(None);

pub fn initialize_transcription_hybrid(app_handle: AppHandle, note_id: u64) {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    if singleton.is_none() {
        *singleton = Some(TranscriptionHybrid::new(app_handle, note_id));
    }
}

pub fn drop_transcription_hybrid() {
    let mut singleton = SINGLETON_INSTANCE.lock().unwrap();
    *singleton = None;
    transcription_hybrid_reazonspeech::drop_transcription_hybrid_reazonspeech();
    transcription_hybrid_whisper::drop_transcription_hybrid_whisper();
    transcription_hybrid_online::drop_transcription_hybrid_online();
}
