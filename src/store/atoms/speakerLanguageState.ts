import { atom } from 'recoil'

export const speakerLanguageState = atom<string|null>({
  key: 'speakerLanguageState',
  default: null
})