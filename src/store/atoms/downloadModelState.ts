import { atom } from 'recoil'

export const downloadModelState = atom<string[]>({
  key: 'downloadModelState',
  default: []
})