import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<string[]> = ({setSelf, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadDownloadedModels("kushinada-hubert-large-jtes-er");
    setSelf(savedValue.map(obj=>obj.model_name));
  };

  if (trigger === 'get') {
    loadPersisted();
  }
};

export const modelKushinadaDownloadedState = atom<string[]>({
  key: 'modelKushinadaDownloadedState',
  default: [],
  effects: [
    sqliteEffect,
  ]
})