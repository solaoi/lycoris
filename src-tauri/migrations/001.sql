CREATE TABLE speeches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    speech_type TEXT,
    unix_time INTEGER,
    content TEXT,
    wav TEXT,
    model TEXT
);
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
INSERT INTO models(model_name, model_type) VALUES("ja", "vosk");
INSERT INTO models(model_name, model_type) VALUES("en-us", "vosk");
