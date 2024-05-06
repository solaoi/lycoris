import { atom } from 'recoil'
import { AppWindowType } from '../../type/AppWindow.type'

export const appWindowState = atom<AppWindowType|null>({
  key: 'appWindowState',
  default: null
})
