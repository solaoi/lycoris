import { atom } from 'recoil'

export const appSelectedState = atom<string|null>({
  key: 'appSelectedState',
  default: null
})