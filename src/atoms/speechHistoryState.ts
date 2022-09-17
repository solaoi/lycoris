import { atom } from 'recoil'
import { SpeechHistoryType } from '../components/molecules/SpeechHistory'

export const speechHistoryState = atom<SpeechHistoryType[]>({
  key: 'speechHistoryState',
  default: []
})