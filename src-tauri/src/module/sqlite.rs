use crate::BUNDLE_IDENTIFIER;
use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::api::path::data_dir;

pub struct Sqlite {
    conn: Connection,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct Speech {
    pub id: u16,
    pub speech_type: String,
    pub created_at_unixtime: u64,
    pub content: String,
    pub wav: String,
    pub model: String,
    pub model_description: String,
    pub note_id: u64,
    pub is_desktop: bool,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct Updated {
    pub id: u16,
    pub content: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct UnexecutedAction {
    pub id: u16,
    pub content: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct Content {
    pub speech_type: String,
    pub content: String,
    pub content_2: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct Permission {
    pub model: String,
}

impl Sqlite {
    pub fn new() -> Self {
        let data_dir = data_dir().unwrap_or(PathBuf::from("./"));
        let db_path = data_dir.join(BUNDLE_IDENTIFIER).join("speeches.db");
        let conn = Connection::open(&db_path).unwrap();
        println!("{}", conn.is_autocommit());
        conn.pragma_update(None, "foreign_keys", true).unwrap();
        Self { conn }
    }

    pub fn select_all_speeches_by(&self, note_id: u64) -> Result<Vec<Speech>, rusqlite::Error> {
        let mut stmt = self.conn.prepare("SELECT id,speech_type,created_at_unixtime,content,wav,model,model_description,note_id FROM speeches WHERE note_id = ?1").unwrap();
        let results = stmt
            .query_map(params![note_id], |row| {
                Ok(Speech {
                    id: row.get_unwrap(0),
                    speech_type: row.get_unwrap(1),
                    created_at_unixtime: row.get_unwrap(2),
                    content: row.get_unwrap(3),
                    wav: row.get_unwrap(4),
                    model: row.get_unwrap(5),
                    model_description: row.get_unwrap(6),
                    note_id: row.get_unwrap(7),
                    is_desktop: false,
                })
            })
            .unwrap()
            .collect::<Result<Vec<_>, rusqlite::Error>>();
        results
    }

    pub fn select_vosk(&self, note_id: u64) -> Result<Speech, rusqlite::Error> {
        return self.conn
            .query_row("SELECT id,speech_type,created_at_unixtime,content,wav,model,model_description,note_id FROM speeches WHERE model = \"vosk\" AND note_id = ?1 ORDER BY created_at_unixtime ASC LIMIT 1", 
            params![note_id],
            |row| {
                Ok(Speech {
                    id: row.get_unwrap(0),
                    speech_type: row.get_unwrap(1),
                    created_at_unixtime: row.get_unwrap(2),
                    content: row.get_unwrap(3),
                    wav: row.get_unwrap(4),
                    model: row.get_unwrap(5),
                    model_description: row.get_unwrap(6),
                    note_id: row.get_unwrap(7),
                    is_desktop: false,
                })
            });
    }

    pub fn select_whisper_token(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingKeyOpenai\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_amivoice_token(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingKeyAmivoice\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_ai_language(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingAILanguage\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_ai_model(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingModel\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_amivoice_model(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingAmiVoiceModel\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_amivoice_logging(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingAmiVoiceLogging\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_ai_resource(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingResource\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_ai_template(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingTemplate\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_fc_functions(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingFCfunctions\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_fc_function_call(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingFCfunctionCall\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_ai_hook(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingHook\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_has_accessed_screen_capture_permission(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingHasAccessedScreenCapturePermission\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_contents_by(
        &self,
        note_id: u64,
        id: u16,
    ) -> Result<Vec<Content>, rusqlite::Error> {
        let mut stmt = self.conn.prepare("SELECT speech_type,content,content_2 FROM speeches WHERE note_id = ?1 AND id < ?2 ORDER BY created_at_unixtime ASC").unwrap();
        let results = stmt
            .query_map(params![note_id, id], |row| {
                Ok(Content {
                    speech_type: row.get_unwrap(0),
                    content: row.get_unwrap(1),
                    content_2: row.get(2).unwrap_or_default(),
                })
            })
            .unwrap()
            .collect::<Result<Vec<_>, rusqlite::Error>>();
        results
    }

    pub fn select_first_unexecuted_action(
        &self,
        note_id: u64,
    ) -> Result<UnexecutedAction, rusqlite::Error> {
        return self.conn.query_row("SELECT id, content FROM speeches WHERE speech_type = \"action\" AND content_2 IS NULL AND note_id = ?1 ORDER BY created_at_unixtime ASC LIMIT 1",
            params![note_id],
            |row| Ok(UnexecutedAction{id: row.get_unwrap(0), content: row.get_unwrap(1)}),
        );
    }

    pub fn select_has_no_permission_of_execute_action(
        &self,
        note_id: u64,
        id: u16,
    ) -> Result<Vec<Permission>, rusqlite::Error> {
        let mut stmt = self.conn.prepare("SELECT model FROM speeches WHERE id = (SELECT MAX(id) FROM speeches WHERE note_id = ?1 AND id < ?2 AND model != \"manual\") OR id = (SELECT MIN(id) FROM speeches WHERE note_id = ?1 AND id > ?2 AND model = \"whisper\")").unwrap();
        let results = stmt
            .query_map(params![note_id, id], |row| {
                Ok(Permission {
                    model: row.get_unwrap(0),
                })
            })
            .unwrap()
            .collect::<Result<Vec<_>, rusqlite::Error>>();
        results
    }

    pub fn update_action_content_2(
        &self,
        id: u16,
        content_2: String,
    ) -> Result<Updated, rusqlite::Error> {
        match self.conn.execute(
            "UPDATE speeches SET content_2 = ?1 WHERE id = ?2",
            params![content_2, id],
        ) {
            Ok(_) => Ok(Updated {
                id,
                content: content_2,
            }),
            Err(err) => Err(err),
        }
    }

    pub fn update_has_accessed_screen_capture_permission(&self) -> Result<usize, rusqlite::Error> {
        self.conn.execute(
            "UPDATE settings SET setting_status = \"has_accessed\" WHERE setting_name = \"settingHasAccessedScreenCapturePermission\"",
            params![],
        )
    }

    pub fn update_model_vosk_to_whisper(
        &self,
        id: u16,
        content: String,
    ) -> Result<Updated, rusqlite::Error> {
        if content == "" {
            match self.conn.execute(
                "UPDATE speeches SET model = 'whisper' WHERE id = ?1",
                params![id],
            ) {
                Ok(_) => Ok(Updated { id, content }),
                Err(err) => Err(err),
            }
        } else {
            match self.conn.execute(
                "UPDATE speeches SET model = 'whisper', content = ?1 WHERE id = ?2",
                params![content, id],
            ) {
                Ok(_) => Ok(Updated { id, content }),
                Err(err) => Err(err),
            }
        }
    }

    pub fn update_model_is_downloaded(
        &self,
        model_name: String,
        is_downloaded: u16,
    ) -> Result<usize, rusqlite::Error> {
        self.conn.execute(
            "UPDATE models SET is_downloaded = ?1 WHERE model_name = ?2",
            params![is_downloaded, model_name],
        )
    }

    pub fn save_speech(
        &self,
        speech_type: String,
        created_at_unixtime: u64,
        content: String,
        wav: String,
        model: String,
        model_description: String,
        note_id: u64,
    ) -> Result<Speech, rusqlite::Error> {
        match self.conn.execute(
            "INSERT INTO speeches (speech_type, created_at_unixtime, content, wav, model, model_description, note_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![speech_type, created_at_unixtime, content, wav, model, model_description, note_id],
        ) {
            Ok(_) => Ok(Speech { id: self.conn.last_insert_rowid() as u16, speech_type, created_at_unixtime, content, wav, model, model_description, note_id, is_desktop: false }),
            Err(err) => Err(err),
        }
    }

    pub fn delete_note(&self, note_id: u64) -> Result<usize, rusqlite::Error> {
        self.conn
            .execute("DELETE FROM notes WHERE id = ?1", params![note_id])
    }

    pub fn delete_speeches_by(&self, note_id: u64) -> Result<usize, rusqlite::Error> {
        self.conn
            .execute("DELETE FROM speeches WHERE note_id = ?1", params![note_id])
    }
}
