CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_title TEXT,
    is_archived INTEGER DEFAULT 0,
    created_at_unixtime INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
    has_emotion INTEGER DEFAULT 0
);
CREATE TABLE speeches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    speech_type TEXT,
    -- speech|memo|screenshot|action
    action_type TEXT,
    -- chat|suggest
    created_at_unixtime INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
    content TEXT,
    content_2 TEXT,
    is_done_with_hybrid_reazonspeech INTEGER DEFAULT 0,
    is_done_with_hybrid_whisper INTEGER DEFAULT 0,
    is_done_with_agent INTEGER DEFAULT 0,
    is_done_with_emotion INTEGER DEFAULT 0,
    hybrid_reazonspeech_content TEXT,
    hybrid_whisper_content TEXT,
    wav TEXT,
    model TEXT,
    -- manual|vosk|whisper
    model_description TEXT,
    -- manual|ja-0.22|small-ja-0.22|en-us-0.22|small-en-us-0.15|cn-0.22|small-cn-0.22|small-ko-0.22|fr-0.22|small-fr-0.22|de-0.21|small-de-0.15|ru-0.42|small-ru-0.22|es-0.42|small-es-0.42|small-pt-0.3|small-tr-0.3|vn-0.4|small-vn-0.4|it-0.22|small-it-0.22|small-nl-0.22|small-ca-0.4|small-uk-v3-small|uk-v3|small-sv-rhasspy-0.15|small-hi-0.22|hi-0.22|small-cs-0.4-rhasspy|small-pl-0.22|small|medium|large
    note_id INTEGER NOT NULL,
    FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
);
CREATE TABLE agent_speeches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    speech_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    content TEXT,
    created_at_unixtime INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
    note_id INTEGER NOT NULL,
    FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
);
CREATE TABLE agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    has_workspace INTEGER DEFAULT 0,
    mode INTEGER DEFAULT 0,
    role_prompt TEXT,
    tool_list TEXT,
    ref_recent_conversation INTEGER DEFAULT 0
);
CREATE TABLE agent_workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    content TEXT,
    created_at_unixtime INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
    note_id INTEGER NOT NULL,
    FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
);
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_name TEXT,
    setting_status TEXT
);
INSERT INTO settings(setting_name, setting_status)
VALUES("speakerLanguage", NULL);
INSERT INTO settings(setting_name, setting_status)
VALUES("transcriptionAccuracy", "off");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingKeyOpenai", "");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingKeyAmivoice", "");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingLanguage", "日本語");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingProcess", "文字起こし（汎用）");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingOnline", "OpenAI");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingTemplate", "");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingFCfunctions", "");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingFCfunctionCall", "");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingHook", "");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingResource", "");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingModel", "gpt-4o-mini");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingAmiVoiceModel", "general");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingAmiVoiceLogging", "off");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingAILanguage", "None");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingSlackWebHookUrl", "");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingDiscordWebHookUrl", "");
INSERT INTO settings(setting_name, setting_status)
VALUES(
        "settingHasAccessedScreenCapturePermission",
        "never"
    );
INSERT INTO settings(setting_name, setting_status)
VALUES("settingAutoApproveLimit", "0");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingSurveyToolEnabled", "1");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingSearchToolEnabled", "1");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingSlackSendTraceMessageEnabled", "0");
INSERT INTO settings(setting_name, setting_status)
VALUES("settingDiscordSendTraceMessageEnabled", "0");
CREATE TABLE models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT,
    model_type TEXT,
    is_downloaded INTEGER DEFAULT 0
);
INSERT INTO models(model_name, model_type)
VALUES("base", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("base.en", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("large", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("large-turbo", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("large-distil.en", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("large-distil.ja", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("large-distil.bilingual", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("medium", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("medium.en", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("small", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("small.en", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("tiny", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("tiny.en", "whisper");
INSERT INTO models(model_name, model_type)
VALUES("ja-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("en-us-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("cn-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("fr-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("de-0.21", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("ru-0.42", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("es-0.42", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("vn-0.4", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("it-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("uk-v3", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("hi-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-ja-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-en-us-0.15", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-cn-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-ko-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-fr-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-de-0.15", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-ru-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-es-0.42", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-pt-0.3", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-tr-0.3", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-vn-0.4", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-it-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-nl-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-ca-0.4", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-uk-v3-small", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-sv-rhasspy-0.15", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-hi-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-cs-0.4-rhasspy", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("small-pl-0.22", "vosk");
INSERT INTO models(model_name, model_type)
VALUES("fugumt-en-ja", "fugumt-en-ja");
INSERT INTO models(model_name, model_type)
VALUES("fugumt-ja-en", "fugumt-ja-en");
INSERT INTO models(model_name, model_type)
VALUES("honyaku-13b", "honyaku-13b");
INSERT INTO models(model_name, model_type)
VALUES("reazonspeech", "reazonspeech");
INSERT INTO models(model_name, model_type)
VALUES("style-bert-vits2", "style-bert-vits2");
INSERT INTO models(model_name, model_type)
VALUES("tsukuyomi-chan", "style-bert-vits2-voice");
INSERT INTO models(model_name, model_type)
VALUES("amitaro", "style-bert-vits2-voice");
INSERT INTO models(model_name, model_type)
VALUES("koharune-ami", "style-bert-vits2-voice");
INSERT INTO models(model_name, model_type)
VALUES("jvnv-F1-jp", "style-bert-vits2-voice");
INSERT INTO models(model_name, model_type)
VALUES("jvnv-F2-jp", "style-bert-vits2-voice");
INSERT INTO models(model_name, model_type)
VALUES("jvnv-M1-jp", "style-bert-vits2-voice");
INSERT INTO models(model_name, model_type)
VALUES("jvnv-M2-jp", "style-bert-vits2-voice");
INSERT INTO models(model_name, model_type)
VALUES("kushinada-hubert-large-jtes-er", "kushinada-hubert-large-jtes-er");
CREATE INDEX idx_hybrid_status ON speeches(
    is_done_with_hybrid_reazonspeech,
    is_done_with_hybrid_whisper
);
