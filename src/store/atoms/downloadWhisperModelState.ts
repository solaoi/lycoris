import { atom } from 'recoil'

export const downloadWhisperModelState = atom<string[]>({
  key: 'downloadWhisperModelState',
  default: []
})