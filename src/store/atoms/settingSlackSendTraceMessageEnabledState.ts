import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: AtomEffect<number> = ({setSelf, onSet, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadSetting("settingSlackSendTraceMessageEnabled");
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
      await db.updateSetting("settingSlackSendTraceMessageEnabled", "0")
    } else {
      await db.updateSetting("settingSlackSendTraceMessageEnabled", newValue.toString())
    }
  });
};

export const settingSlackSendTraceMessageEnabledState = atom<number>({
  key: 'settingSlackSendTraceMessageEnabled',
  default: 0,
  effects: [
    sqliteEffect,
  ]
})