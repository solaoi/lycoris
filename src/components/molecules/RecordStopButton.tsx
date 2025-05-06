import { invoke } from '@tauri-apps/api/core'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { recordingNoteState } from '../../store/atoms/recordingNoteState'
import { recordState } from '../../store/atoms/recordState'
import { transcriptionAccuracyState } from '../../store/atoms/transcriptionAccuracyState'
import { traceState } from '../../store/atoms/traceState'
import { selectedNoteState } from '../../store/atoms/selectedNoteState'

const RecordStopButton = (): JSX.Element => {
    const setRecording = useSetRecoilState(recordState)
    const setRecordingNote = useSetRecoilState(recordingNoteState)
    const selectedNote = useRecoilValue(selectedNoteState);
    const setTracable = useSetRecoilState(traceState(selectedNote!.note_id));
    const transcriptionAccuracy = useRecoilValue(transcriptionAccuracyState);
    const click = () => {
        setRecording(false)
        setRecordingNote(null)
        invoke('stop_command')
        if (transcriptionAccuracy === "off") {
            setTracable(true)
        }
    }

    return (
        <button className="btn gap-2 bg-white border border-solid border-neutral-300 text-secondary" onClick={click}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
            </svg>
            録音終了
        </button>
    )
}

export { RecordStopButton }