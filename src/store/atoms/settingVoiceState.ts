import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<string> = ({setSelf, onSet, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadSetting("settingVoice");
    if (savedValue === null) {
      setSelf("JVNV");
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
      await db.updateSetting("settingVoice", "JVNV")
    } else {
      await db.updateSetting("settingVoice", newValue)
    }
  });
};

export const settingVoiceState = atom<string>({
  key: 'settingVoiceState',
  default: "JVNV",
  effects: [
    sqliteEffect,
  ]
})