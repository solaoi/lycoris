import { atom } from 'recoil'

export const modelNllbDownloadingState = atom<string[]>({
  key: 'modelNllbDownloadingState',
  default: []
})