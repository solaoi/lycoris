import { atom } from 'recoil'

export const modelVoskDownloadingState = atom<string[]>({
  key: 'modelVoskDownloadingState',
  default: []
})