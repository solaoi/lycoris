import { AtomEffect, atomFamily } from 'recoil'
import DB from '../../lib/sqlite';
import { SpeechHistoryType } from '../../type/SpeechHistory.type'
import { invoke } from '@tauri-apps/api';

const sqliteEffect: (note_id:number) => AtomEffect<SpeechHistoryType[]> = 
  (note_id) => {
    return ({setSelf, onSet, trigger}) => {
      const loadPersisted = async () => {
        const db = (await DB.getInstance())
        const savedValue =  await db.selectSpeechesBy(note_id);
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
          const old = oldValue as SpeechHistoryType[];
          if (old.length < newValue.length) {
            const current = newValue[newValue.length - 1];
            if (current.speech_type === "memo" || current.speech_type === "action"){
              await db.saveSpeech({...current, note_id}).then(async()=>{
                await loadPersisted();
                if (current.speech_type === "action") {
                  invoke('execute_action_command', { noteId: current.note_id })
                }
            });
            }
          }
        }
      });
    }
  };

export const speechHistoryState = atomFamily({
  key: 'speechHistoryState',
  default: [],
  effects: (note_id:number) => [
    sqliteEffect(note_id),
  ]
})