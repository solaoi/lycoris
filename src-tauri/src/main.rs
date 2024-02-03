#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use crossbeam_channel::Sender;
use module::model_type_nllb::ModelTypeNllb;
use module::model_type_vosk::ModelTypeVosk;
use module::model_type_whisper::ModelTypeWhisper;
use module::transcription::TraceCompletion;
use tauri::http::HttpRange;
use tauri::http::ResponseBuilder;
use tauri::Manager;
use tauri::State;
use tauri_plugin_sql::{Migration, MigrationKind};

use crossbeam_channel::unbounded;
use std::cmp::min;
use std::io::Read;
use std::io::Seek;
use std::io::SeekFrom;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::{Arc, Mutex};

use urlencoding::decode;

mod module;
use module::device::Device;

struct RecordState(Arc<Mutex<Option<Sender<()>>>>);

const BUNDLE_IDENTIFIER: &str = "blog.aota.Lycoris";

#[tauri::command]
fn delete_note_command(window: tauri::Window, note_id: u64) {
    std::thread::spawn(move || {
        let deleter = module::deleter::NoteDeleter::new(window.app_handle().clone());
        deleter.delete(note_id)
    });
}

#[tauri::command]
fn download_whisper_model_command(window: tauri::Window, model: String) {
    std::thread::spawn(move || {
        let dl =
            module::downloader::whisper::WhisperModelDownloader::new(window.app_handle().clone());
        dl.download(ModelTypeWhisper::from_str(&model).unwrap())
    });
}

#[tauri::command]
fn download_vosk_model_command(window: tauri::Window, model: String) {
    std::thread::spawn(move || {
        let dl = module::downloader::vosk::VoskModelDownloader::new(window.app_handle().clone());
        dl.download(ModelTypeVosk::from_str(&model).unwrap())
    });
}

#[tauri::command]
fn download_nllb_model_command(window: tauri::Window, model: String) {
    std::thread::spawn(move || {
        let dl = module::downloader::nllb::NllbModelDownloader::new(window.app_handle().clone());
        dl.download(ModelTypeNllb::from_str(&model).unwrap())
    });
}

#[tauri::command]
fn list_devices_command() -> Vec<Device> {
    module::device::list_devices()
}

#[tauri::command]
fn start_command(
    state: State<'_, RecordState>,
    window: tauri::Window,
    device_label: String,
    speaker_language: String,
    transcription_accuracy: String,
    note_id: u64,
) {
    let mut lock = state.0.lock().unwrap();
    let (stop_record_tx, stop_record_rx) = unbounded();
    *lock = Some(stop_record_tx);
    std::thread::spawn(move || {
        let record = module::record::Record::new(window.app_handle().clone());
        record.start(
            device_label,
            speaker_language,
            transcription_accuracy,
            note_id,
            stop_record_rx,
        );
    });
}

#[tauri::command]
fn stop_command(state: State<'_, RecordState>) {
    let mut lock = state.0.lock().unwrap();
    if let Some(stop_record_tx) = lock.take() {
        stop_record_tx.send(()).unwrap()
    }
}

#[tauri::command]
fn start_trace_command(
    state: State<'_, RecordState>,
    window: tauri::Window,
    speaker_language: String,
    transcription_accuracy: String,
    note_id: u64,
) {
    let mut lock = state.0.lock().unwrap();
    let (stop_convert_tx, stop_convert_rx) = unbounded();
    *lock = Some(stop_convert_tx);

    std::thread::spawn(move || {
        if transcription_accuracy.starts_with("online-transcript") {
            let mut transcription_online = module::transcription_online::TranscriptionOnline::new(
                window.app_handle(),
                transcription_accuracy,
                speaker_language,
                note_id,
            );
            transcription_online.start(stop_convert_rx, true);
        } else if transcription_accuracy.starts_with("online-chat") {
            let mut chat_online = module::chat_online::ChatOnline::new(
                window.app_handle(),
                speaker_language,
                note_id,
            );
            chat_online.start(stop_convert_rx, true);
        } else {
            let mut transcription = module::transcription::Transcription::new(
                window.app_handle(),
                transcription_accuracy,
                speaker_language,
                note_id,
            );
            transcription.start(stop_convert_rx, true);
        }
    });
}

#[tauri::command]
fn stop_trace_command(state: State<'_, RecordState>, window: tauri::Window) {
    let mut lock = state.0.lock().unwrap();
    if let Some(stop_convert_tx) = lock.take() {
        stop_convert_tx.send(()).unwrap_or_else(|_| {
            window
                .app_handle()
                .emit_all("traceCompletion", TraceCompletion {})
                .unwrap();
        })
    }
}

fn main() {
    tauri::Builder::default()
        .register_uri_scheme_protocol("stream", move |_app, request| {
            let raw_path = request.uri().replace("stream://localhost", "");
            let decoded_path = decode(raw_path.as_str()).unwrap().to_string();

            let audio_file = PathBuf::from(&decoded_path);
            let mut content = std::fs::File::open(&audio_file)?;
            let mut buf = Vec::new();

            let mut response = ResponseBuilder::new();
            let mut status_code = 200;

            if let Some(range) = request.headers().get("range") {
                let file_size = content.metadata().unwrap().len();
                let range = HttpRange::parse(range.to_str().unwrap(), file_size).unwrap();

                let first_range = range.first();
                if let Some(range) = first_range {
                    let mut real_length = range.length;
                    if range.length > file_size / 3 {
                        real_length = min(file_size - range.start, 1024 * 400);
                    }
                    let last_byte = range.start + real_length - 1;

                    status_code = 206;
                    response = response
                        .header("Connection", "Keep-Alive")
                        .header("Accept-Ranges", "bytes")
                        .header("Content-Length", real_length)
                        .header(
                            "Content-Range",
                            format!("bytes {}-{}/{}", range.start, last_byte, file_size),
                        );

                    content.seek(SeekFrom::Start(range.start))?;
                    content.take(real_length).read_to_end(&mut buf)?;
                } else {
                    content.read_to_end(&mut buf)?;
                }
            }
            response.mimetype("audio/wav").status(status_code).body(buf)
        })
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:speeches.db",
                    vec![Migration {
                        version: 1,
                        description: "create speeches table",
                        sql: include_str!("../migrations/001.sql"),
                        kind: MigrationKind::Up,
                    }],
                )
                .build(),
        )
        .manage(RecordState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            delete_note_command,
            download_nllb_model_command,
            download_whisper_model_command,
            download_vosk_model_command,
            list_devices_command,
            start_command,
            stop_command,
            start_trace_command,
            stop_trace_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
