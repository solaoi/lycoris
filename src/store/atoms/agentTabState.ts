import { atom } from 'recoil'

export const agentTabState = atom<string|null>({
  key: 'agentTabState',
  default: null
})