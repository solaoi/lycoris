import { atom } from 'recoil'

export const recordingNoteState = atom<number|null>({
  key: 'recordingNoteState',
  default: null
})