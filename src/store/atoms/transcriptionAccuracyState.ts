import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<string|null> = ({setSelf, onSet, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadSetting("transcriptionAccuracy");
    setSelf(savedValue.setting_status);
  };

  if (trigger === 'get') {
    loadPersisted();
  }

  onSet(async(newValue, _, isReset:any) => {
    const db = await DB.getInstance()
    if (isReset) {
      await db.updateSetting("transcriptionAccuracy", "off")
    } else {
      await db.updateSetting("transcriptionAccuracy", newValue)
    }
  });
};

export const transcriptionAccuracyState = atom<string|null>({
  key: 'transcriptionAccuracyState',
  default: "off",
  effects: [
    sqliteEffect,
  ]
})