import { atom } from 'recoil'

export const modelFugumtDownloadingState = atom<string[]>({
  key: 'modelFugumtDownloadingState',
  default: []
})