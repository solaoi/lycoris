import { AtomEffect, atomFamily } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: (note_id:number) => AtomEffect<number> = 
  (note_id) => {
    return ({setSelf, onSet, trigger}) => {
      const loadPersisted = async () => {
        const db = (await DB.getInstance())
        const savedValue =  await db.selectHasEmotionBy(note_id);
        setSelf(savedValue);
      };

      if (trigger === 'get') {
        loadPersisted();
      }

      onSet(async(newValue, _, isReset:any) => {
        const db = await DB.getInstance()
        if (isReset) {
          await db.updateHasEmotionBy(note_id, 0)
        } else {
          await db.updateHasEmotionBy(note_id, newValue)
        }
      });
    }
  };

export const emotionWithNoteState = atomFamily({
  key: 'emotionWithNoteState',
  default: 0,
  effects: (note_id:number) => [
    sqliteEffect(note_id),
  ]
})