import { AtomEffect, atomFamily } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: (note_id:number) => AtomEffect<boolean> = 
  (note_id) => {
    return ({setSelf, onSet, trigger}) => {
      const loadPersisted = async () => {
        const db = (await DB.getInstance())
        const savedValue =  await db.selectSpeechesBy(note_id);
        
        if (savedValue.filter(v=>v.model === "vosk").length > 0) {
          setSelf(true);
        }
      };

      if (trigger === 'get') {
        loadPersisted();
      }

      onSet(async() => {
          await loadPersisted();
      });
    }
  };

export const traceState = atomFamily({
  key: 'traceState',
  default: false,
  effects: (note_id:number) => [
    sqliteEffect(note_id),
  ]
})