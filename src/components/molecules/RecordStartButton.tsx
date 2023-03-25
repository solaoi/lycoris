import { useRecoilState, useRecoilValue } from 'recoil'
import { audioDeviceState } from '../../store/atoms/audioDeviceState';
import { invoke } from '@tauri-apps/api/tauri'
import { recordState } from '../../store/atoms/recordState';
import { speakerLanguageState } from '../../store/atoms/speakerLanguageState';
import { transcriptionAccuracyState } from '../../store/atoms/transcriptionAccuracyState';
import { selectedNoteState } from '../../store/atoms/selectedNoteState';
import { recordingNoteState } from '../../store/atoms/recordingNoteState';

const RecordStartButton = (): JSX.Element => {
    const deviceLabel = useRecoilValue(audioDeviceState)
    const speakerLanguage = useRecoilValue(speakerLanguageState)
    const transcriptionAccuracy = useRecoilValue(transcriptionAccuracyState)
    const [isRecording, setRecording] = useRecoilState(recordState)
    const selectedNote = useRecoilValue(selectedNoteState)
    const [recordingNote, setRecordingNote] = useRecoilState(recordingNoteState)
    const click = () => {
        setRecording(true)
        setRecordingNote(selectedNote!.note_id)
        invoke('start_command', { deviceLabel, speakerLanguage, transcriptionAccuracy, noteId: selectedNote!.note_id })
    }

    return (
        <button className="btn gap-2 glass text-primary" disabled={deviceLabel === null || speakerLanguage === null || (isRecording && recordingNote !== selectedNote?.note_id)} onClick={click}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            録音開始
        </button>
    )
}

export { RecordStartButton }