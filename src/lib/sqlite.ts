import Database from 'tauri-plugin-sql-api'
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
    }

    return this.instance
  }

  public async deleteSpeech(speech: SpeechHistoryType) {
    await this.db.execute('DELETE FROM speeches WHERE id = $1', [speech.id])
  }

  public async deleteAllSpeeches() {
    await this.db.execute('DELETE FROM speeches')
  }

  public async loadAllSpeeches(): Promise<SpeechHistoryType[]> {
    return await this.db.select('SELECT * FROM speeches')
  }

  public async loadDownloadedModels(model_type: string): Promise<{model_name: string}[]> {
    return await this.db.select('SELECT model_name FROM models WHERE is_downloaded = 1 AND model_type = $1', [model_type])
  }

  public async saveSpeech(speech: SpeechHistoryType): Promise<SpeechHistoryType> {
    const { lastInsertId } = await this.db.execute(
      'INSERT INTO speeches(speech_type, unix_time, content, wav, model) VALUES($1, $2, $3, $4, $5)',
      [speech.speech_type, speech.unix_time, speech.content, speech.wav, speech.model]
    )

    return {
      ...speech,
      id: lastInsertId,
    }
  }

  public async updateSpeech(speech: SpeechHistoryType) {
    await this.db.execute(
      'UPDATE speeches SET speech_type = $1, unix_time = $2, content = $3, wav = $4 model = $5 WHERE id = $6',
      [speech.speech_type, speech.unix_time, speech.content, speech.wav, speech.model, speech.id]
    )
  }
}
