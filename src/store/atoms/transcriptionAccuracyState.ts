import { atom } from 'recoil'

export const transcriptionAccuracyState = atom<string|null>({
  key: 'transcriptionAccuracyState',
  default: "off"
})