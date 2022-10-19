CREATE TABLE speeches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    speech_type TEXT,
    unix_time INTEGER,
    content TEXT,
    wav TEXT
);