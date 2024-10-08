#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    http::{HttpRange, ResponseBuilder},
    Manager, State, Window,
};
use tauri_plugin_sql::{Migration, MigrationKind};

use std::{
    cmp::min,
    env,
    io::{Read, Seek, SeekFrom},
    path::PathBuf,
    str::FromStr,
    sync::{Arc, Mutex},
};

use crossbeam_channel::{unbounded, Sender};
use urlencoding::decode;

mod module;
use module::{
    action,
    chat_online::ChatOnline,
    deleter::NoteDeleter,
    device::{self, Device},
    downloader::{
        fugumt::FugumtModelDownloader, honyaku13b::Honyaku13BModelDownloader,
        vosk::VoskModelDownloader, whisper::WhisperModelDownloader,
    },
    model_type_vosk::ModelTypeVosk,
    model_type_whisper::ModelTypeWhisper,
    permissions,
    record::Record,
    record_desktop::RecordDesktop,
    screenshot::{self, AppWindow},
    transcription::{TraceCompletion, Transcription},
    transcription_amivoice::TranscriptionAmivoice,
    transcription_online::TranscriptionOnline,
    translation_ja::TranslationJa,
    translation_ja_high::TranslationJaHigh,
};

struct RecordState(Arc<Mutex<Option<Sender<()>>>>);

const BUNDLE_IDENTIFIER: &str = "blog.aota.Lycoris";

#[tauri::command]
fn delete_note_command(window: Window, note_id: u64) {
    std::thread::spawn(move || {
        let deleter = NoteDeleter::new(window.app_handle().clone());
        deleter.delete(note_id)
    });
}

#[tauri::command]
fn download_whisper_model_command(window: Window, model: String) {
    std::thread::spawn(move || {
        let dl = WhisperModelDownloader::new(window.app_handle().clone());
        dl.download(ModelTypeWhisper::from_str(&model).unwrap())
    });
}

#[tauri::command]
fn download_vosk_model_command(window: Window, model: String) {
    std::thread::spawn(move || {
        let dl = VoskModelDownloader::new(window.app_handle().clone());
        dl.download(ModelTypeVosk::from_str(&model).unwrap())
    });
}

#[tauri::command]
fn download_fugumt_model_command(window: Window) {
    std::thread::spawn(move || {
        let dl = FugumtModelDownloader::new(window.app_handle().clone());
        dl.download()
    });
}

#[tauri::command]
fn download_honyaku13b_model_command(window: Window) {
    std::thread::spawn(move || {
        let dl = Honyaku13BModelDownloader::new(window.app_handle().clone());
        dl.download()
    });
}

#[tauri::command]
fn list_devices_command() -> Vec<Device> {
    device::list_devices()
}

#[tauri::command]
fn list_apps_command() -> Vec<String> {
    screenshot::list_apps()
}

#[tauri::command]
fn list_app_windows_command(app_name: String) -> Vec<AppWindow> {
    screenshot::list_app_windows(app_name)
}

#[tauri::command]
fn screenshot_command(window: Window, window_id: u32, note_id: u64) -> bool {
    screenshot::screenshot(window_id, note_id, window.app_handle().clone())
}

#[tauri::command]
fn has_accessibility_permission_command() -> bool {
    permissions::has_accessibility_permission()
}

#[tauri::command]
fn has_screen_capture_permission_command(window: Window) -> bool {
    permissions::has_screen_capture_permission(window)
}

#[tauri::command]
fn has_microphone_permission_command(window: Window) -> bool {
    permissions::has_microphone_permission(window)
}

#[tauri::command]
fn execute_action_command(window: Window, note_id: u64) {
    std::thread::spawn(move || {
        if action::initialize_action(window.app_handle().clone(), note_id) {
            let mut lock = action::SINGLETON_INSTANCE.lock().unwrap();
            if let Some(singleton) = lock.as_mut() {
                singleton.execute();
            }
        } else {
            println!("Action is already initialized and executing. Skipping.");
        }
        action::drop_action();
    });
}

#[tauri::command]
fn start_command(
    state: State<'_, RecordState>,
    window: Window,
    device_label: String,
    speaker_language: String,
    transcription_accuracy: String,
    note_id: u64,
    device_type: String, // microphone, desktop, both
) {
    let mut lock = state.0.lock().unwrap();
    let (stop_record_tx, stop_record_rx) = unbounded();
    *lock = Some(stop_record_tx);
    std::thread::spawn(move || {
        if device_type == "microphone" {
            let record = Record::new(window.app_handle().clone());
            record.start(
                device_label,
                speaker_language,
                transcription_accuracy,
                note_id,
                stop_record_rx,
            );
        } else if device_type == "desktop" {
            let record_desktop = RecordDesktop::new(window.app_handle().clone());
            record_desktop.start(
                speaker_language,
                transcription_accuracy,
                note_id,
                stop_record_rx,
                None,
            );
        } else {
            let record = Record::new(window.app_handle().clone());
            let record_desktop = RecordDesktop::new(window.app_handle().clone());

            let (stop_record_clone_tx, stop_record_clone_rx) = unbounded();
            let speaker_language_clone = speaker_language.clone();
            let transcription_accuracy_clone = transcription_accuracy.clone();

            std::thread::spawn(move || {
                record_desktop.start(
                    speaker_language_clone,
                    transcription_accuracy_clone,
                    note_id,
                    stop_record_rx,
                    Some(stop_record_clone_tx),
                );
            });
            record.start(
                device_label,
                speaker_language,
                transcription_accuracy,
                note_id,
                stop_record_clone_rx.clone(),
            );
        }
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
            let mut transcription_online = TranscriptionOnline::new(
                window.app_handle(),
                transcription_accuracy,
                speaker_language,
                note_id,
            );
            transcription_online.start(stop_convert_rx, true);
        } else if transcription_accuracy.starts_with("online-amivoice") {
            let mut transcription_amivoice =
                TranscriptionAmivoice::new(window.app_handle(), note_id);
            transcription_amivoice.start(stop_convert_rx, true);
        } else if transcription_accuracy.starts_with("online-chat") {
            let mut chat_online = ChatOnline::new(window.app_handle(), speaker_language, note_id);
            chat_online.start(stop_convert_rx, true);
        } else if transcription_accuracy.starts_with("fugumt-en-ja") {
            let mut translation_ja =
                TranslationJa::new(window.app_handle(), speaker_language, note_id);
            translation_ja.start(stop_convert_rx, true);
        } else if transcription_accuracy.starts_with("honyaku13b-q4-0") {
            let mut translation_ja_high =
                TranslationJaHigh::new(window.app_handle(), speaker_language, note_id);
            translation_ja_high.start(stop_convert_rx, true);
        } else {
            let mut transcription = Transcription::new(
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

fn set_whisper_metal_lib_path(relative_path: &str) {
    if let Ok(exe_path) = env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let absolute_path = exe_dir.join(relative_path);
            if let Some(absolute_path_str) = absolute_path.to_str() {
                println!("Setting GGML_METAL_PATH_RESOURCES to {}", absolute_path_str);
                env::set_var("GGML_METAL_PATH_RESOURCES", absolute_path_str);
            }
        } else {
            eprintln!("GGML_METAL_PATH_RESOURCES cloud not be set: Failed to get the executable directory.");
        }
    } else {
        eprintln!("GGML_METAL_PATH_RESOURCES cloud not be set: Failed to get the executable path.");
    }
}

fn main() {
    #[cfg(not(debug_assertions))]
    set_whisper_metal_lib_path("../Resources/resources/whisper");
    #[cfg(debug_assertions)]
    set_whisper_metal_lib_path("../../resources/whisper");

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
        .plugin(tauri_plugin_clipboard::init())
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
            download_whisper_model_command,
            download_vosk_model_command,
            download_fugumt_model_command,
            download_honyaku13b_model_command,
            list_devices_command,
            list_apps_command,
            list_app_windows_command,
            screenshot_command,
            has_accessibility_permission_command,
            has_screen_capture_permission_command,
            has_microphone_permission_command,
            execute_action_command,
            start_command,
            stop_command,
            start_trace_command,
            stop_trace_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
