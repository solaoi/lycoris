import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<string[]> = ({setSelf, onSet, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadActiveTranslationLanguages();
    setSelf(savedValue.map(obj=>obj.setting_status));
  };

  if (trigger === 'get') {
    loadPersisted();
  }

  onSet(async(newValue, oldValue, isReset:any) => {
    const db = await DB.getInstance()
    if (isReset) {
      await loadPersisted();
    } else {
      const old = oldValue as string[];
      if (old.length > newValue.length){
        const deleted = old.filter(o=>!newValue.includes(o))[0];
        await db.deleteSetting("translationActive", deleted)
      }
      if (old.length < newValue.length){
        await db.insertSetting("translationActive", newValue[newValue.length - 1])
      }
    }
  });
};

export const settingTranslationLanguagesState = atom<string[]>({
  key: 'settingTranslationLanguagesState',
  default: [],
  effects: [
    sqliteEffect,
  ]
})