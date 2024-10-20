import { atom } from 'recoil'
import { AppWindowType } from '../../type/AppWindow.type'

export const appWindowsState = atom<AppWindowType[]>({
  key: 'appWindowsState',
  default: []
})
