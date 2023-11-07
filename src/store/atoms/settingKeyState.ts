import { AtomEffect, atomFamily } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: (setting_name:string) => AtomEffect<string> =
  (setting_name) => {
    return ({setSelf, onSet, trigger}) => {
      const loadPersisted = async () => {
        const db = (await DB.getInstance())
        const savedValue =  await db.loadSetting(setting_name);
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
          await db.updateSetting(setting_name, "")
        } else {
          await db.updateSetting(setting_name, newValue)
        }
      });
    }
  };

export const settingKeyState = atomFamily({
  key: 'settingKeyState',
  default: "",
  effects: (setting_name:string) => [
    sqliteEffect(setting_name),
  ]
})