import { atom } from 'recoil'

export const audioDeviceState = atom<string|null>({
  key: 'audioDeviceState',
  default: null
})