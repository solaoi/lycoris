import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<string> = ({setSelf, onSet, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadSetting("settingOnline");
    if (savedValue === null) {
      setSelf("OpenAI");
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
      await db.updateSetting("settingOnline", "OpenAI")
    } else {
      await db.updateSetting("settingOnline", newValue)
    }
  });
};

export const settingOnlineState = atom<string>({
  key: 'settingOnlineState',
  default: "OpenAI",
  effects: [
    sqliteEffect,
  ]
})