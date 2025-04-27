import { atom } from 'recoil'

export const agentSelectedState = atom<string[]>({
    key: 'agentSelectedState',
    default: []
})