import { AtomEffect, atomFamily } from 'recoil'
import DB from '../../lib/sqlite';
import { AgentWorkspaceType } from '../../type/AgentWorkspace.type';

const sqliteEffect: (note_id:number) => AtomEffect<AgentWorkspaceType[]> = 
  (note_id) => {
    return ({setSelf, onSet, trigger}) => {
      const loadPersisted = async () => {
        const db = (await DB.getInstance())
        const savedValue =  await db.selectAgentWorkspacesBy(note_id);
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

export const agentWorkspaceState = atomFamily({
  key: 'agentWorkspaceState',
  default: [],
  effects: (note_id:number) => [
    sqliteEffect(note_id),
  ]
})