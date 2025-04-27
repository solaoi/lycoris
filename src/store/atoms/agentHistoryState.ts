import { AtomEffect, atomFamily } from 'recoil'
import DB from '../../lib/sqlite';
import { AgentHistoryType } from '../../type/AgentHistory.type'

const sqliteEffect: (note_id:number) => AtomEffect<AgentHistoryType[]> = 
  (note_id) => {
    return ({setSelf, onSet, trigger}) => {
      const loadPersisted = async () => {
        const db = (await DB.getInstance())
        const savedValue =  await db.selectAgentSpeechesBy(note_id);
        if (savedValue.length > 0 ) {
          setSelf(savedValue);
        }
      };

      if (trigger === 'get') {
        loadPersisted();
      }

      onSet(async(newValue, oldValue, isReset:any) => {
        if (isReset) {
          await loadPersisted();
        }
      });
    }
  };

export const agentHistoryState = atomFamily({
  key: 'agentHistoryState',
  default: [],
  effects: (note_id:number) => [
    sqliteEffect(note_id),
  ]
})