use crate::BUNDLE_IDENTIFIER;
use rusqlite::{params, Connection};
use serde_json::Value;
use std::{collections::HashMap, path::PathBuf};
use tauri::api::path::data_dir;

use super::mcp_host::ToolConfig;

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
pub struct Agent {
    pub id: u16,
    pub name: String,
    pub has_workspace: u16,
    pub mode: u16,
    pub role_prompt: String,
    pub tool_list: String,
    pub ref_recent_conversation: u16,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct PreTranscript {
    pub id: u16,
    pub hybrid_whisper_content: String,
    pub hybrid_reazonspeech_content: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct Updated {
    pub id: u16,
    pub content: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct UnexecutedAction {
    pub id: u16,
    pub action_type: String,
    pub content: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct Content {
    pub speech_type: String,
    pub action_type: String,
    pub content: String,
    pub content_2: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct Permission {
    pub model: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ToolExecutionCmd {
    pub call_id: String,
    pub args: Value,
    pub name: String,
    pub method: String,
    pub description: String,
    pub result: Option<String>,
}
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ToolExecution {
    pub is_required_user_permission: bool,
    pub content: String,
    pub cmds: Vec<ToolExecutionCmd>,
}
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ToolExecutionWrapper {
    pub id: u16,
    pub note_id: u64,
    pub content: String,
    pub tool_execution: ToolExecution,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct WhisperContent {
    pub id: u16,
    pub content: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EmotionContent {
    pub id: u16,
    pub content: String,
    pub wav: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AgentHistory {
    pub id: u16,
    pub created_at_unixtime: u64,
    pub content: String,
    pub speech_id: u16,
    pub agent_id: u16,
    pub note_id: u64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AgentWorkspace {
    pub id: u16,
    pub content: String,
    pub agent_id: u16,
    pub created_at_unixtime: u64,
    pub note_id: u64,
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

    pub fn select_all_tools(&self) -> Result<HashMap<String, ToolConfig>, rusqlite::Error> {
        let mut stmt = self
            .conn
            .prepare("SELECT name, command, args, env, disabled, ai_auto_approve, instruction, auto_approve FROM tools")
            .unwrap();
        let results = stmt
            .query_map(params![], |row| {
                Ok((
                    row.get_unwrap(0),
                    ToolConfig {
                        command: row.get_unwrap(1),
                        args: serde_json::from_str(&row.get_unwrap::<_, String>(2))
                            .unwrap_or_default(),
                        env: serde_json::from_str(&row.get_unwrap::<_, String>(3))
                            .unwrap_or_default(),
                        disabled: Some(row.get_unwrap::<_, u16>(4)),
                        ai_auto_approve: Some(row.get_unwrap::<_, u16>(5)),
                        instruction: Some(row.get_unwrap::<_, String>(6)),
                        auto_approve: serde_json::from_str(&row.get_unwrap::<_, String>(7))
                            .unwrap_or_default(),
                    },
                ))
            })
            .unwrap()
            .collect::<Result<HashMap<String, ToolConfig>, rusqlite::Error>>();
        results
    }

    pub fn select_tool(&self, speech_id: u64) -> Result<ToolExecutionWrapper, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT id, note_id, content, content_2 FROM speeches WHERE id = ?1",
            params![speech_id],
            |row| {
                let id: u16 = row.get_unwrap(0);
                let note_id: u64 = row.get_unwrap(1);
                let content: String = row.get_unwrap(2);
                let content_2: String = row.get_unwrap(3);

                let tool_execution: ToolExecution =
                    serde_json::from_str(&content_2).map_err(|e| {
                        rusqlite::Error::FromSqlConversionFailure(
                            0,
                            rusqlite::types::Type::Text,
                            Box::new(e),
                        )
                    })?;

                Ok(ToolExecutionWrapper {
                    id,
                    note_id,
                    content,
                    tool_execution,
                })
            },
        );
    }

    pub fn select_survey_tool_enabled(&self) -> Result<u16, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingSurveyToolEnabled\"",
            params![],
            |row| {
                let setting_status: String = row.get_unwrap(0);
                Ok(setting_status.parse::<u16>().unwrap())
            },
        );
    }

    pub fn select_search_tool_enabled(&self) -> Result<u16, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingSearchToolEnabled\"",
            params![],
            |row| {
                let setting_status: String = row.get_unwrap(0);
                Ok(setting_status.parse::<u16>().unwrap())
            },
        );
    }

    pub fn select_slack_webhook_url(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingSlackWebHookUrl\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn select_discord_webhook_url(&self) -> Result<String, rusqlite::Error> {
        return self.conn.query_row(
            "SELECT setting_status FROM settings WHERE setting_name = \"settingDiscordWebHookUrl\"",
            params![],
            |row| Ok(row.get_unwrap(0)),
        );
    }

    pub fn update_content_2_on_speech(
        &self,
        speech_id: u64,
        content_2: String,
    ) -> Result<(), rusqlite::Error> {
        self.conn.execute(
            "UPDATE speeches SET content_2 = ?1 WHERE id = ?2",
            params![content_2, speech_id],
        )?;

        Ok(())
    }

    pub fn update_tool_execution(
        &self,
        speech_id: u64,
        tool_execution: &ToolExecution,
    ) -> Result<(), rusqlite::Error> {
        let content = serde_json::to_string(tool_execution).map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
        })?;

        self.conn.execute(
            "UPDATE speeches SET content_2 = ?1 WHERE id = ?2",
            params![content, speech_id],
        )?;

        Ok(())
    }

    pub fn select_agent_workspace(
        &self,
        note_id: u64,
        agent_id: u16,
    ) -> Result<Option<AgentWorkspace>, rusqlite::Error> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT id, content, agent_id, created_at_unixtime, note_id FROM agent_workspaces WHERE note_id = ?1 AND agent_id = ?2",
            )
            .unwrap();
        let params: Vec<&dyn rusqlite::ToSql> = vec![&note_id, &agent_id];

        let results = stmt
            .query_map(params.as_slice(), |row| {
                Ok(AgentWorkspace {
                    id: row.get_unwrap(0),
                    content: row.get_unwrap(1),
                    agent_id: row.get_unwrap(2),
                    created_at_unixtime: row.get_unwrap(3),
                    note_id: row.get_unwrap(4),
                })
            })?
            .collect::<Result<Vec<_>, rusqlite::Error>>()?;
        Ok(results.first().cloned())
    }

    pub fn select_agent(&self, agent_name: String) -> Result<Agent, rusqlite::Error> {
        let mut stmt = self.conn.prepare("SELECT id, name, has_workspace, mode, role_prompt, tool_list, ref_recent_conversation FROM agents WHERE name = ?1").unwrap();
        let params: Vec<&dyn rusqlite::ToSql> = vec![&agent_name];

        let results = stmt
            .query_map(params.as_slice(), |row| {
                Ok(Agent {
                    id: row.get_unwrap(0),
                    name: row.get_unwrap(1),
                    has_workspace: row.get_unwrap(2),
                    mode: row.get_unwrap(3),
                    role_prompt: row.get_unwrap(4),
                    tool_list: row.get_unwrap(5),
                    ref_recent_conversation: row.get_unwrap(6),
                })
            })?
            .collect::<Result<Vec<_>, rusqlite::Error>>()?;
        Ok(results[0].clone())
    }

    pub fn select_all_agents(&self) -> Result<Vec<Agent>, rusqlite::Error> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, has_workspace, mode, role_prompt, tool_list, ref_recent_conversation FROM agents")
            .unwrap();
        let results = stmt
            .query_map(params![], |row| {
                Ok(Agent {
                    id: row.get_unwrap(0),
                    name: row.get_unwrap(1),
                    has_workspace: row.get_unwrap(2),
                    mode: row.get_unwrap(3),
                    role_prompt: row.get_unwrap(4),
                    tool_list: row.get_unwrap(5),
                    ref_recent_conversation: row.get_unwrap(6),
                })
            })
            .unwrap()
            .collect::<Result<Vec<_>, rusqlite::Error>>();
        results
    }

    pub fn insert_agent(
        &self,
        name: String,
        has_workspace: u16,
        mode: u16,
        role_prompt: String,
        tool_list: String,
        ref_recent_conversation: u16,
    ) -> Result<Agent, rusqlite::Error> {
        let mut stmt = self.conn.prepare(
            "
            INSERT INTO agents (name, has_workspace, mode, role_prompt, tool_list, ref_recent_conversation) 
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            RETURNING id, name, has_workspace, mode, role_prompt, tool_list, ref_recent_conversation
        ",
        )?;

        let agent = stmt.query_row(
            rusqlite::params![name, has_workspace, mode, role_prompt, tool_list, ref_recent_conversation],
            |row| {
                Ok(Agent {
                    id: row.get_unwrap(0),
                    name: row.get_unwrap(1),
                    has_workspace: row.get_unwrap(2),
                    mode: row.get_unwrap(3),
                    role_prompt: row.get_unwrap(4),
                    tool_list: row.get_unwrap(5),
                    ref_recent_conversation: row.get_unwrap(6),
                })
            },
        )?;

        Ok(agent)
    }

    pub fn upsert_agent_workspace(
        &self,
        id: Option<u16>,
        content: String,
        agent_id: u16,
        note_id: u64,
    ) -> Result<AgentWorkspace, rusqlite::Error> {
        let mut stmt = self.conn.prepare(
            r#"
            INSERT INTO agent_workspaces (id, content, agent_id, note_id)
            VALUES (?1, ?2, ?3, ?4)
            ON CONFLICT(id) DO UPDATE SET content = excluded.content
            RETURNING id, content, agent_id, created_at_unixtime, note_id
            "#
        )?;
        let row = stmt.query_row(
            (&id, &content, &agent_id, &note_id),
            |row| Ok(AgentWorkspace {
                id: row.get_unwrap(0),
                content: row.get_unwrap(1),
                agent_id: row.get_unwrap(2),
                created_at_unixtime: row.get_unwrap(3),
                note_id: row.get_unwrap(4),
            }),
        )?;

        Ok(row)
    }

    pub fn delete_agents(&self, agent_names: Vec<String>) -> Result<(), rusqlite::Error> {
        if agent_names.is_empty() {
            return Ok(());
        }

        let placeholders = (0..agent_names.len())
            .map(|i| format!("?{}", i + 1))
            .collect::<Vec<_>>()
            .join(",");

        let sql = format!("DELETE FROM agents WHERE name IN ({})", placeholders);
        let params = agent_names
            .iter()
            .map(|name| name as &dyn rusqlite::ToSql)
            .collect::<Vec<_>>();

        self.conn.execute(&sql, &params[..])?;
        Ok(())
    }

    pub fn insert_tool(
        &self,
        name: String,
        command: String,
        args: String,
        env: String,
        disabled: Option<u16>,
        ai_auto_approve: Option<u16>,
        instruction: Option<String>,
        auto_approve: Vec<String>,
    ) -> Result<(), rusqlite::Error> {
        self.conn.execute(
            "INSERT INTO tools (name, command, args, env, disabled, ai_auto_approve, instruction, auto_approve) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![name, command, args, env, disabled.unwrap_or(0), ai_auto_approve.unwrap_or(0), instruction.unwrap_or("".to_string()), serde_json::to_string(&auto_approve).unwrap_or("[]".to_string())],
        )?;

        Ok(())
    }

    pub fn update_tool(
        &self,
        tool_name: String,
        disabled: u16,
        ai_auto_approve: u16,
        instruction: String,
        auto_approve: Vec<String>,
    ) -> Result<(), rusqlite::Error> {
        self.conn.execute(
            "UPDATE tools SET disabled = ?1, ai_auto_approve = ?2, instruction = ?3, auto_approve = ?4 WHERE name = ?5",
            params![disabled, ai_auto_approve, instruction, serde_json::to_string(&auto_approve).unwrap_or("[]".to_string()), tool_name],
        )?;

        Ok(())
    }

    pub fn delete_tool(&self, tool_name: String) -> Result<usize, rusqlite::Error> {
        self.conn
            .execute("DELETE FROM tools WHERE name = ?1", params![tool_name])
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

    pub fn select_lateset_speeches(
        &self,
        note_id: u64,
        max_history_count: u64,
    ) -> Result<Vec<Speech>, rusqlite::Error> {
        let mut stmt = self.conn
            .prepare("SELECT id,speech_type,created_at_unixtime,content,wav,model,model_description,note_id FROM speeches WHERE model = \"whisper\" AND is_done_with_hybrid_whisper = 1 AND is_done_with_hybrid_reazonspeech = 1 AND note_id = ?1 ORDER BY created_at_unixtime DESC LIMIT ?2").unwrap();
        let results = stmt
            .query_map(params![note_id, max_history_count], |row| {
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

    pub fn select_latest_agent_speeches(
        &self,
        note_id: u64,
        agent_id: u16,
        max_history_count: u64,
    ) -> Result<Vec<AgentHistory>, rusqlite::Error> {
        let mut stmt = self.conn.prepare("SELECT id,created_at_unixtime,content,speech_id,agent_id,note_id FROM agent_speeches WHERE note_id = ?1 AND agent_id = ?2 ORDER BY created_at_unixtime DESC LIMIT ?3").unwrap();
        let results = stmt.query_map(params![note_id, agent_id, max_history_count], |row| {
            Ok(AgentHistory {
                id: row.get_unwrap(0),
                created_at_unixtime: row.get_unwrap(1),
                content: row.get_unwrap(2),
                speech_id: row.get_unwrap(3),
                agent_id: row.get_unwrap(4),
                note_id: row.get_unwrap(5),
            })
        }).unwrap().collect::<Result<Vec<_>, rusqlite::Error>>();
        results
    }

    pub fn select_no_proccessed_with_hybrid_reazonspeech(
        &self,
        note_id: u64,
    ) -> Result<Speech, rusqlite::Error> {
        return self.conn
            .query_row("SELECT id,speech_type,created_at_unixtime,content,wav,model,model_description,note_id FROM speeches WHERE model = \"vosk\" AND is_done_with_hybrid_reazonspeech = 0 AND note_id = ?1 ORDER BY created_at_unixtime ASC LIMIT 1", 
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

    pub fn select_no_proccessed_with_hybrid_whisper(
        &self,
        note_id: u64,
    ) -> Result<Speech, rusqlite::Error> {
        return self.conn
            .query_row("SELECT id,speech_type,created_at_unixtime,content,wav,model,model_description,note_id FROM speeches WHERE model = \"vosk\" AND is_done_with_hybrid_whisper = 0 AND note_id = ?1 ORDER BY created_at_unixtime ASC LIMIT 1", 
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

    pub fn select_pre_transcript_with_hybrid(
        &self,
        note_id: u64,
    ) -> Result<PreTranscript, rusqlite::Error> {
        return self.conn
            .query_row("SELECT id, hybrid_whisper_content, hybrid_reazonspeech_content FROM speeches WHERE model = \"vosk\" AND is_done_with_hybrid_whisper = 1 AND is_done_with_hybrid_reazonspeech = 1 AND note_id = ?1 ORDER BY created_at_unixtime ASC LIMIT 1", 
            params![note_id],
            |row| {
                Ok(PreTranscript {
                    id: row.get_unwrap(0),
                    hybrid_whisper_content: row.get_unwrap(1),
                    hybrid_reazonspeech_content: row.get_unwrap(2),
                })
            });
    }

    pub fn select_whisper_with_no_agent(
        &self,
        note_id: u64,
    ) -> Result<WhisperContent, rusqlite::Error> {
        return self.conn
            .query_row("SELECT id, content FROM speeches WHERE model = \"whisper\" AND is_done_with_agent = 0 AND note_id = ?1 ORDER BY created_at_unixtime ASC LIMIT 1", 
            params![note_id],
            |row| {
                Ok(WhisperContent {
                    id: row.get_unwrap(0),
                    content: row.get_unwrap(1),
                })
            });
    }

    pub fn select_speech_with_no_emotion(
        &self,
        note_id: u64,
    ) -> Result<EmotionContent, rusqlite::Error> {
        return self.conn
            .query_row("SELECT id, content, wav FROM speeches WHERE is_done_with_emotion = 0 AND note_id = ?1 ORDER BY created_at_unixtime ASC LIMIT 1", 
            params![note_id],
            |row| {
                Ok(EmotionContent {
                    id: row.get_unwrap(0),
                    content: row.get_unwrap(1),
                    wav: row.get_unwrap(2),
                })
            });
    }

    pub fn update_speech_agent_done(&self, speech_id: u16) -> Result<(), rusqlite::Error> {
        self.conn.execute(
            "UPDATE speeches SET is_done_with_agent = 1 WHERE id = ?1",
            params![speech_id],
        )?;
        Ok(())
    }

    pub fn update_speech_emotion_done(&self, speech_id: u16, emotion_id: u16) -> Result<(), rusqlite::Error> {
        self.conn.execute(
            "UPDATE speeches SET is_done_with_emotion = ?1 WHERE id = ?2",
            params![emotion_id, speech_id],
        )?;
        Ok(())
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
        let mut stmt = self.conn.prepare("SELECT speech_type,action_type,content,content_2 FROM speeches WHERE note_id = ?1 AND id < ?2 ORDER BY created_at_unixtime ASC").unwrap();
        let results = stmt
            .query_map(params![note_id, id], |row| {
                Ok(Content {
                    speech_type: row.get_unwrap(0),
                    action_type: row.get(1).unwrap_or_default(),
                    content: row.get_unwrap(2),
                    content_2: row.get(3).unwrap_or_default(),
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
        return self.conn.query_row("SELECT id, action_type, content FROM speeches WHERE speech_type = \"action\" AND content_2 IS NULL AND note_id = ?1 ORDER BY created_at_unixtime ASC LIMIT 1",
            params![note_id],
            |row| Ok(UnexecutedAction{id: row.get_unwrap(0), action_type: row.get_unwrap(1), content: row.get_unwrap(2)}),
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
        if content.is_empty() {
            let existing_content: String = self.conn.query_row(
                "SELECT content FROM speeches WHERE id = ?1",
                [id],
                |row| row.get(0),
            )?;
    
            self.conn.execute(
                "UPDATE speeches SET model = 'whisper' WHERE id = ?1",
                params![id],
            )?;
    
            Ok(Updated { id, content: existing_content })
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

    pub fn update_hybrid_reazonspeech_content(
        &self,
        id: u16,
        content: String,
    ) -> Result<Updated, rusqlite::Error> {
        match self.conn.execute(
            "UPDATE speeches SET is_done_with_hybrid_reazonspeech = 1, hybrid_reazonspeech_content = ?1 WHERE id = ?2",
            params![content, id],
        ) {
            Ok(_) => Ok(Updated { id, content }),
            Err(err) => Err(err),
        }
    }

    pub fn update_hybrid_whisper_content(
        &self,
        id: u16,
        content: String,
    ) -> Result<Updated, rusqlite::Error> {
        match self.conn.execute(
            "UPDATE speeches SET is_done_with_hybrid_whisper = 1, hybrid_whisper_content = ?1 WHERE id = ?2",
            params![content, id],
        ) {
            Ok(_) => Ok(Updated { id, content }),
            Err(err) => Err(err),
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

    pub fn insert_agent_speech(
        &self,
        speech_id: u16,
        agent_id: u16,
        content: String,
        note_id: u64,
    ) -> Result<AgentHistory, rusqlite::Error> {
        return self.conn.query_row(
            "INSERT INTO agent_speeches (speech_id, agent_id, content, note_id) VALUES (?1, ?2, ?3, ?4) RETURNING id,speech_id,agent_id,content,created_at_unixtime,note_id",
            params![speech_id, agent_id, content, note_id],
            |row| Ok(AgentHistory { id: row.get_unwrap(0), speech_id: row.get_unwrap(1), agent_id: row.get_unwrap(2), content: row.get_unwrap(3), created_at_unixtime: row.get_unwrap(4), note_id: row.get_unwrap(5) }),
        );
    }

    pub fn delete_note(&self, note_id: u64) -> Result<usize, rusqlite::Error> {
        self.conn
            .execute("DELETE FROM notes WHERE id = ?1", params![note_id])
    }

    pub fn ensure_tools_table_exists(&self) -> Result<(), rusqlite::Error> {
        // テーブルが存在するか確認
        let exists: bool = self.conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='tools')",
            [],
            |row| row.get(0),
        )?;

        // 存在しなければ作成
        if !exists {
            println!("Creating tools table...");
            self.conn.execute(
                "CREATE TABLE tools (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT,
                    command TEXT,
                    args TEXT,
                    env TEXT,
                    disabled INTEGER DEFAULT 0,
                    ai_auto_approve INTEGER DEFAULT 0,
                    instruction TEXT,
                    auto_approve TEXT
                )",
                [],
            )?;
        }

        Ok(())
    }
}
