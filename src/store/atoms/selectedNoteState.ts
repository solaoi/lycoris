import { atom } from 'recoil'

type SelectedNote = {
  note_id: number;
  note_title: string;
}

export const selectedNoteState = atom<SelectedNote|null>({
  key: 'selectedNoteState',
  default: null
})
