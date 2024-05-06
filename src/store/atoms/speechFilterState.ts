import { atom } from 'recoil'

export const speechFilterState = atom<string|null>({
  key: 'speechFilterState',
  default: null
})