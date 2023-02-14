import { atom } from 'recoil'

export const downloadVoskModelState = atom<string[]>({
  key: 'downloadVoskModelState',
  default: []
})