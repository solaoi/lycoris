import { atom } from 'recoil'

export const actionState = atom<string|null>({
  key: 'actionState',
  default: "チャット"
})