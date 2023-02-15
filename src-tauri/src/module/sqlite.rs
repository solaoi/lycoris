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
    pub unix_time: u64,
    pub content: String,
    pub wav: String,
    pub model: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct Updated {
    pub id: u16,
    pub content: String,
}

impl Sqlite {
    pub fn new() -> Self {
        let data_dir = data_dir().unwrap_or(PathBuf::from("./"));
        let db_path = data_dir.join(BUNDLE_IDENTIFIER).join("speeches.db");
        let conn = Connection::open(&db_path).unwrap();
        println!("{}", conn.is_autocommit());
        Self { conn }
    }

    pub fn select_vosk(&self) -> Result<Speech, rusqlite::Error> {
        return self.conn
            .query_row("SELECT id,speech_type,unix_time,content,wav,model FROM speeches WHERE model = \"vosk\" ORDER BY unix_time ASC LIMIT 1", 
            [],
            |row| {
                Ok(Speech {
                    id: row.get_unwrap(0),
                    speech_type: row.get_unwrap(1),
                    unix_time: row.get_unwrap(2),
                    content: row.get_unwrap(3),
                    wav: row.get_unwrap(4),
                    model: row.get_unwrap(5),
                })
            });
    }

    pub fn update_model_vosk_to_whisper(
        &self,
        id: u16,
        content: String,
    ) -> Result<Updated, rusqlite::Error> {
        if content == "" {
            match self.conn.execute(
                "UPDATE speeches SET model = 'whisper-small' WHERE id = ?1",
                params![id],
            ) {
                Ok(_) => Ok(Updated { id, content }),
                Err(err) => Err(err),
            }
        } else {
            match self.conn.execute(
                "UPDATE speeches SET model = 'whisper-small', content = ?1 WHERE id = ?2",
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
        unix_time: u64,
        content: String,
        wav: String,
        model: String,
    ) -> Result<Speech, rusqlite::Error> {
        match self.conn.execute(
            "INSERT INTO speeches (speech_type, unix_time, content, wav, model) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![speech_type, unix_time, content, wav, model],
        ) {
            Ok(_) => Ok(Speech { id: self.conn.last_insert_rowid() as u16, speech_type, unix_time, content, wav, model }),
            Err(err) => Err(err),
        }
    }
}
