import { atom } from 'recoil'

export const agentSwitcherState = atom<number | null>({
  key: 'agentSwitcherState',
  default: null
})