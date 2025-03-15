import { atom } from 'recoil'

export const prevMethodsState = atom<string[][]>({
  key: 'prevMethodsState',
  default: []
})
