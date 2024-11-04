import { atom } from 'recoil'

export const modelReazonSpeechDownloadingState = atom<string[]>({
  key: 'modelReazonSpeechDownloadingState',
  default: []
})