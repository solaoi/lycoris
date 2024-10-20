import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<string[]> = ({setSelf, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadDownloadedModels("style-bert-vits2-voice");
    setSelf(savedValue.map(obj=>obj.model_name));
  };

  if (trigger === 'get') {
    loadPersisted();
  }
};

export const modelStyleBertVits2VoiceDownloadedState = atom<string[]>({
  key: 'modelStyleBertVits2VoiceDownloadedState',
  default: [],
  effects: [
    sqliteEffect,
  ]
})