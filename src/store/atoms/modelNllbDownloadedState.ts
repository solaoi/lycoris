import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<string[]> = ({setSelf, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadDownloadedModels("nllb");
    setSelf(savedValue.map(obj=>obj.model_name));
  };

  if (trigger === 'get') {
    loadPersisted();
  }
};

export const modelNllbDownloadedState = atom<string[]>({
  key: 'modelNllbDownloadedState',
  default: [],
  effects: [
    sqliteEffect,
  ]
})