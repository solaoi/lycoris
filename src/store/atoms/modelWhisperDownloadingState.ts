import { atom } from 'recoil'

export const modelWhisperDownloadingState = atom<string[]>({
  key: 'modelWhisperDownloadingState',
  default: []
})