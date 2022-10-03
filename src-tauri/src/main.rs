#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;
use tauri::State;
use tauri_plugin_sql::{Migration, MigrationKind, TauriSql};

use std::sync::{
    mpsc::{sync_channel, SyncSender},
    Arc, Mutex,
};

mod module;
use module::device::Device;

struct RecordState(Arc<Mutex<Option<SyncSender<()>>>>);

#[tauri::command]
fn list_devices_command() -> Vec<Device> {
    module::device::list_devices()
}

#[tauri::command]
fn start_command(state: State<'_, RecordState>, window: tauri::Window, device_label: String) {
    let mut lock = state.0.lock().unwrap();
    let (sender, receiver) = sync_channel(1);
    *lock = Some(sender);

    std::thread::spawn(move || {
        let record = module::record::Record::new(window.app_handle().clone());
        record.start(device_label, receiver);
    });
}

#[tauri::command]
fn stop_command(state: State<'_, RecordState>) {
    let mut lock = state.0.lock().unwrap();
    if let Some(sender) = lock.take() {
        sender.send(()).unwrap()
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(TauriSql::default().add_migrations(
            "sqlite:speeches.db",
            vec![Migration {
                version: 1,
                description: "create speeches table",
                sql: include_str!("../migrations/001.sql"),
                kind: MigrationKind::Up,
            }],
        ))
        .manage(RecordState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            list_devices_command,
            start_command,
            stop_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
