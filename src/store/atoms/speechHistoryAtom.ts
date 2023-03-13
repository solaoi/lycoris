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

  onSet(async(newValue, oldValue, isReset:any) => {
    const db = await DB.getInstance()
    if (isReset) {
      await db.deleteAllSpeeches()
    } else {
      const old = oldValue as SpeechHistoryType[];
      if (old.length !== newValue.length) {
        const current = newValue[newValue.length - 1];
        if (current.speech_type === "memo"){
          await db.saveSpeech(current);
        }
      }
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