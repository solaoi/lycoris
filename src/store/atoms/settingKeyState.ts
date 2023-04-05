import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<string> = ({setSelf, onSet, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadSetting("settingKey");
    if (savedValue === null) {
      setSelf("");
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
      await db.updateSetting("settingKey", "")
    } else {
      await db.updateSetting("settingKey", newValue)
    }
  });
};

export const settingKeyState = atom<string>({
  key: 'settingKeyState',
  default: "",
  effects: [
    sqliteEffect,
  ]
})