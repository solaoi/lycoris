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
    model_description TEXT, -- ja-0.22|small-ja-0.22|en-us-0.22|small-en-us-0.15|small|medium|large
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
INSERT INTO models(model_name, model_type) VALUES("small-ja-0.22", "vosk");
INSERT INTO models(model_name, model_type) VALUES("small-en-us-0.15", "vosk");
