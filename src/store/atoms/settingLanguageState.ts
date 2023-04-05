import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<string> = ({setSelf, onSet, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadSetting("settingLanguage");
    if (savedValue === null) {
      setSelf("日本語");
    } else {
      setSelf(savedValue!.setting_status);
    }
  };

  if (trigger === 'get') {
    loadPersisted();
  }

  onSet(async(newValue, _, isReset:any) => {
    const db = await DB.getInstance()
    if (isReset) {
      await db.updateSetting("settingLanguage", "日本語")
    } else {
      await db.updateSetting("settingLanguage", newValue)
    }
  });
};

export const settingLanguageState = atom<string>({
  key: 'settingLanguageState',
  default: "日本語",
  effects: [
    sqliteEffect,
  ]
})