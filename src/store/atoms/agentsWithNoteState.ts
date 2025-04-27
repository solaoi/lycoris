import { AtomEffect, atomFamily } from 'recoil'
import DB from '../../lib/sqlite';

const sqliteEffect: (note_id:number) => AtomEffect<number[]> = 
  (note_id) => {
    return ({setSelf, onSet, trigger}) => {
      const loadPersisted = async () => {
        const db = (await DB.getInstance())
        const savedValue =  await db.selectAgentsBy(note_id);
        const agentIds = savedValue.map(({agent_id}) => agent_id);

        setSelf(agentIds);
      };

      if (trigger === 'get') {
        loadPersisted();
      }

      onSet(async() => {
          await loadPersisted();
      });
    }
  };

export const agentsWithNoteState = atomFamily({
  key: 'agentsWithNoteState',
  default: [],
  effects: (note_id:number) => [
    sqliteEffect(note_id),
  ]
})