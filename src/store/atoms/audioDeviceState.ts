import { atom } from 'recoil'

export const audioDeviceState = atom<number|null>({
  key: 'audioDeviceState',
  default: null
})