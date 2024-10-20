import { atom } from 'recoil'

export const modelFugumtEnJaDownloadingState = atom<string[]>({
  key: 'modelFugumtEnJaDownloadingState',
  default: []
})