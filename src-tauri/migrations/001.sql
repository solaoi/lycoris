CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_title TEXT,
    is_archived INTEGER DEFAULT 0,
    created_at_unixtime INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER))
);
CREATE TABLE speeches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    speech_type TEXT, -- speech|memo
    created_at_unixtime INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)),
    content TEXT,
    wav TEXT,
    model TEXT, -- manual|vosk|whisper
    model_description TEXT, -- ja-0.22|small-ja-0.22|en-us-0.22|small-en-us-0.15|cn-0.22|small-cn-0.22|small-ko-0.22|fr-0.22|small-fr-0.22|de-0.21|small-de-0.15|ru-0.42|small-ru-0.22|es-0.42|small-es-0.42|small-pt-0.3|small-tr-0.3|vn-0.4|small-vn-0.4|it-0.22|small-it-0.22|small-nl-0.22|small-ca-0.4|small-uk-v3-small|uk-v3|small-sv-rhasspy-0.15|small-hi-0.22|hi-0.22|small-cs-0.4-rhasspy|small-pl-0.22|small|medium|large
    note_id INTEGER NOT NULL,
    FOREIGN KEY(note_id) REFERENCES notes(id)
);
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_name TEXT,
    setting_status TEXT
);
INSERT INTO settings(setting_name, setting_status) VALUES("speakerLanguage", NULL);
INSERT INTO settings(setting_name, setting_status) VALUES("transcriptionAccuracy", "off");
INSERT INTO settings(setting_name, setting_status) VALUES("settingKey", "");
INSERT INTO settings(setting_name, setting_status) VALUES("settingLanguage", "日本語");
CREATE TABLE models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT,
    model_type TEXT,
    is_downloaded INTEGER DEFAULT 0
);
INSERT INTO models(model_name, model_type) VALUES("base", "whisper");
INSERT INTO models(model_name, model_type) VALUES("base.en", "whisper");
INSERT INTO models(model_name, model_type) VALUES("large-v1", "whisper");
INSERT INTO models(model_name, model_type) VALUES("large", "whisper");
INSERT INTO models(model_name, model_type) VALUES("medium", "whisper");
INSERT INTO models(model_name, model_type) VALUES("medium.en", "whisper");
INSERT INTO models(model_name, model_type) VALUES("small", "whisper");
INSERT INTO models(model_name, model_type) VALUES("small.en", "whisper");
INSERT INTO models(model_name, model_type) VALUES("tiny", "whisper");
INSERT INTO models(model_name, model_type) VALUES("tiny.en", "whisper");
INSERT INTO models(model_name, model_type) VALUES("ja-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("en-us-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("cn-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("fr-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("de-0.21", "vosk");
INSERT INTO models(model_name, model_type) VALUES("ru-0.42", "vosk");
INSERT INTO models(model_name, model_type) VALUES("es-0.42", "vosk");
INSERT INTO models(model_name, model_type) VALUES("vn-0.4", "vosk");
INSERT INTO models(model_name, model_type) VALUES("it-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("uk-v3", "vosk");
INSERT INTO models(model_name, model_type) VALUES("hi-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-ja-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-en-us-0.15", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-cn-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-ko-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-fr-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-de-0.15", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-ru-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-es-0.42", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-pt-0.3", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-tr-0.3", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-vn-0.4", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-it-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-nl-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-ca-0.4", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-uk-v3-small", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-sv-rhasspy-0.15", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-hi-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-cs-0.4-rhasspy", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-pl-0.22", "vosk");
