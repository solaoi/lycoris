import { atom } from 'recoil'

export const modelKushinadaDownloadingState = atom<string[]>({
  key: 'modelKushinadaDownloadingState',
  default: []
})