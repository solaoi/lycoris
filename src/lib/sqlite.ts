import Database from 'tauri-plugin-sql-api'
import { NoteType } from '../type/Note.type'
import { SpeechHistoryType } from '../type/SpeechHistory.type'

export default class DB {
  private db: Database

  private constructor(db: Database) {
    this.db = db
  }

  private static instance: DB

  static async getInstance(): Promise<DB> {
    if (!this.instance) {
      this.instance = new this(await Database.load('sqlite:speeches.db'))
      this.instance.db.execute('PRAGMA foreign_keys=true')
    }

    return this.instance
  }

  public async deleteSpeech(speech: SpeechHistoryType) {
    await this.db.execute('DELETE FROM speeches WHERE id = $1', [speech.id])
  }

  public async updateSpeech(speech: SpeechHistoryType) {
    await this.db.execute(
      'UPDATE speeches SET speech_type = $1, action_type = $2, created_at_unixtime = $3, content = $4, wav = $5, model = $6, model_description = $7, note_id = $8 WHERE id = $9',
      [speech.speech_type, speech.action_type, speech.created_at_unixtime, speech.content, speech.wav, speech.model, speech.model_description, speech.note_id, speech.id]
    )
  }

  public async updateSuggest(id: number, active: string) {
    await this.db.execute(
      'UPDATE speeches SET content = $1 WHERE id = $2',
      [active, id]
    )
  }

  public async selectSpeechesBy(note_id: number): Promise<SpeechHistoryType[]> {
    return await this.db.select('SELECT * FROM speeches WHERE note_id = $1 ORDER BY created_at_unixtime ASC', [note_id])
  }

  public async loadDownloadedModels(model_type: string): Promise<{model_name: string}[]> {
    return await this.db.select('SELECT model_name FROM models WHERE is_downloaded = 1 AND model_type = $1', [model_type])
  }

  public async loadSetting(setting_name: string): Promise<{setting_status: string} | null> {
    const settings:{setting_status: string}[] = await this.db.select('SELECT setting_status FROM settings WHERE setting_name = $1', [setting_name])
    return settings[0] || null;
  }

  public async updateSetting(setting_name: string, setting_status: string|null) {
    await this.db.execute(
      'UPDATE settings SET setting_status = $2 WHERE setting_name = $1',
      [setting_name, setting_status]
    );
  }

  public async saveSpeech(speech: SpeechHistoryType): Promise<SpeechHistoryType> {
    const { lastInsertId } = await this.db.execute(
      'INSERT INTO speeches(speech_type, action_type, created_at_unixtime, content, wav, model, model_description, note_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
      [speech.speech_type, speech.action_type, speech.created_at_unixtime, speech.content, speech.wav, speech.model, speech.model_description, speech.note_id]
    )

    return {
      ...speech,
      id: lastInsertId,
    }
  }

  public async saveNote(note_title: string): Promise<NoteType> {
    const created_at_unixtime = new Date().getTime();
    const { lastInsertId } = await this.db.execute(
      'INSERT INTO notes(note_title, created_at_unixtime) VALUES($1, $2)',
      [note_title, created_at_unixtime]
    )

    return {
      id: lastInsertId,
      note_title,
      is_archived: false,
      created_at_unixtime,
    }
  }

  public async updateNote(note_id:number, note_title: string) {
    await this.db.execute(
      'UPDATE notes SET note_title = $2 WHERE id = $1',
      [note_id, note_title]
    );
  }

  public async loadAllNotes(): Promise<NoteType[]> {
    return await this.db.select('SELECT * FROM notes ORDER BY created_at_unixtime DESC')
  }
}
