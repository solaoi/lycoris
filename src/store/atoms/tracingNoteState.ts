import { atom } from 'recoil'

export const tracingNoteState = atom<number|null>({
  key: 'tracingNoteState',
  default: null
})