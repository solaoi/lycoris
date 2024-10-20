import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<string> = ({setSelf, onSet, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadSetting("settingProcess");
    if (savedValue === null) {
      setSelf("文字起こし（汎用）");
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
      await db.updateSetting("settingProcess", "文字起こし（汎用）")
    } else {
      await db.updateSetting("settingProcess", newValue)
    }
  });
};

export const settingProcessState = atom<string>({
  key: 'settingProcessState',
  default: "文字起こし（汎用）",
  effects: [
    sqliteEffect,
  ]
})