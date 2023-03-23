import { atom, AtomEffect } from 'recoil'
import DB from '../../lib/sqlite';
import { NoteType } from '../../type/Note.type'

const sqliteEffect: AtomEffect<NoteType[]> = ({setSelf, onSet, trigger}) => {
  const loadPersisted = async () => {
    const db = (await DB.getInstance())
    const savedValue =  await db.loadAllNotes();
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
      await loadPersisted();
    } else {
      const old = oldValue as NoteType[];
      if (old.length < newValue.length) {
        const current = newValue[newValue.length - 1];
        await db.saveNote(current.note_title);
        await loadPersisted();
      } else if (old.length > newValue.length) {
        await loadPersisted();
      } else {
        let i = 0;
        for(const v of newValue){
          if (old[i].note_title !== v.note_title) {
            await db.updateNote(v.id!, v.note_title);
            break;
          }
          i++;
        }
        setSelf(newValue);
      }
    }
  });
};

export const notesState = atom<NoteType[]>({
  key: 'notesState',
  default: [],
  effects: [
    sqliteEffect,
  ]
})