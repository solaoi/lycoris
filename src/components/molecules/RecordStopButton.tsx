import { invoke } from '@tauri-apps/api/tauri'
import { useSetRecoilState } from 'recoil'
import { recordingNoteState } from '../../store/atoms/recordingNoteState'
import { recordState } from '../../store/atoms/recordState'

const RecordStopButton = (): JSX.Element => {
    const setRecording = useSetRecoilState(recordState)
    const setRecordingNote = useSetRecoilState(recordingNoteState)
    const click = () => {
        setRecording(false)
        setRecordingNote(null)
        invoke('stop_command')
    }

    return (
        <button className="btn gap-2 glass border border-solid border-neutral-300 text-secondary" onClick={click}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
            </svg>
            録音終了
        </button>
    )
}

export { RecordStopButton }