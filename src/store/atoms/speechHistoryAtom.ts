import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';
import { SpeechHistoryType } from '../../type/SpeechHistory.type'

const sqliteEffect: AtomEffect<SpeechHistoryType[]> = ({setSelf, onSet, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadAllSpeeches();
    if (savedValue.length > 0 ) {
      setSelf(savedValue);
    }
  };

  if (trigger === 'get') {
    loadPersisted();
  }

  onSet(async(newValue, _:any, isReset:any) => {
    const db = await DB.getInstance()
    if (isReset) {
      await db.deleteAllSpeeches()
    } else {
      db.saveSpeech(newValue[newValue.length - 1])
    }
  });
};

export const speechHistoryAtom = atom<SpeechHistoryType[]>({
  key: 'speechHistoryState',
  default: [],
  effects: [
    sqliteEffect,
  ]
})