import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<number> = ({setSelf, onSet, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadSetting("settingAutoApproveLimit");
    if (savedValue === null) {
      setSelf(0);
    }else{
      setSelf(parseInt(savedValue.setting_status));
    }
  };

  if (trigger === 'get') {
    loadPersisted();
  }

  onSet(async(newValue, _, isReset:any) => {
    const db = await DB.getInstance()
    if (isReset) {
      await db.updateSetting("settingAutoApproveLimit", "0")
    } else {
      await db.updateSetting("settingAutoApproveLimit", newValue.toString())
    }
  });
};

export const settingAutoApproveLimitState = atom<number>({
  key: 'settingAutoApproveLimitState',
  default: 0,
  effects: [
    sqliteEffect,
  ]
})