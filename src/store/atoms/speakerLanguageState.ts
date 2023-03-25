import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<string|null> = ({setSelf, onSet, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadSetting("speakerLanguage");
    if (savedValue === null) {
      setSelf(null);
    }else{
      setSelf(savedValue.setting_status);
    }
  };

  if (trigger === 'get') {
    loadPersisted();
  }

  onSet(async(newValue, _, isReset:any) => {
    const db = await DB.getInstance()
    if (isReset) {
      await db.updateSetting("speakerLanguage", null)
    } else {
      await db.updateSetting("speakerLanguage", newValue)
    }
  });
};

export const speakerLanguageState = atom<string|null>({
  key: 'speakerLanguageState',
  default: null,
  effects: [
    sqliteEffect,
  ]
})