use std::fs::remove_file;

use crate::module::sqlite::Sqlite;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, serde::Serialize)]
pub struct DeleteCompletion {
    pub note_id: u64,
    pub is_finished: bool,
}

pub struct NoteDeleter {
    app_handle: AppHandle,
}
impl NoteDeleter {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    pub fn delete(&self, note_id: u64) {
        let sqlite = Sqlite::new();
        let speeches = sqlite.select_all_speeches_by(note_id).unwrap();
        let _ = speeches.iter().for_each(|speech| {
            if !speech.wav.is_empty() {
                if let Err(e) = remove_file(&speech.wav) {
                    eprintln!("Failed to delete file {}: {}", &speech.wav, e);
                }
            }
        });

        let _ = sqlite.delete_speeches_by(note_id);
        let _ = sqlite.delete_note(note_id);

        let _ = &self.app_handle.emit_all(
            "deleteCompletion",
            DeleteCompletion {
                note_id,
                is_finished: true,
            },
        );
    }
}
