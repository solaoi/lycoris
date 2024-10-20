import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<string[]> = ({setSelf, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadDownloadedModels("fugumt-en-ja");
    setSelf(savedValue.map(obj=>obj.model_name));
  };

  if (trigger === 'get') {
    loadPersisted();
  }
};

export const modelFugumtEnJaDownloadedState = atom<string[]>({
  key: 'modelFugumtEnJaDownloadedState',
  default: [],
  effects: [
    sqliteEffect,
  ]
})