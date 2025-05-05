import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri'
import { useEffect } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { recordingNoteState } from '../../store/atoms/recordingNoteState';
import { recordState } from '../../store/atoms/recordState';
import { selectedNoteState } from '../../store/atoms/selectedNoteState';
import { speakerLanguageState } from '../../store/atoms/speakerLanguageState';
import { traceState } from '../../store/atoms/traceState';
import { tracingNoteState } from '../../store/atoms/tracingNoteState';
import { tracingState } from '../../store/atoms/tracingState';
import { transcriptionAccuracyState } from '../../store/atoms/transcriptionAccuracyState';
import { emotionWithNoteState } from '../../store/atoms/emotionWithNoteState';

const TraceStartButton = (): JSX.Element => {
    const isRecording = useRecoilValue(recordState);
    const selectedNote = useRecoilValue(selectedNoteState);
    const [isTracable, setTracable] = useRecoilState(traceState(selectedNote!.note_id));
    const setTracing = useSetRecoilState(tracingState);
    const transcriptionAccuracy = useRecoilValue(transcriptionAccuracyState);
    const speakerLanguage = useRecoilValue(speakerLanguageState)
    const setTracingNote = useSetRecoilState(tracingNoteState)
    const recordingNote = useRecoilValue(recordingNoteState)
    const isTracing = useRecoilValue(tracingState);
    const hasEmotion = useRecoilValue(emotionWithNoteState(selectedNote!.note_id))

    const click = () => {
        setTracing(true)
        setTracingNote(selectedNote!.note_id)
        invoke('start_trace_command', { speakerLanguage, transcriptionAccuracy, noteId: selectedNote!.note_id, hasEmotion: hasEmotion === 1 })
    }

    useEffect(() => {
        const unlistenTraceUnCompletion = listen('traceUnCompletion', () => {
            setTracable(true)
        })
        const unlistenTraceCompletion = listen('traceCompletion', () => {
            setTracable(false)
        })
        return () => {
            unlistenTraceUnCompletion.then(f => f());
            unlistenTraceCompletion.then(f => f());
        }
    }, [recordingNote])

    return (
        <button className="btn bg-white border border-solid border-neutral-300 text-warning group transition-all duration-300 ease-in-out w-14 hover:w-36 flex items-center justify-center relative disabled:hidden" onClick={click} disabled={transcriptionAccuracy === "off" || isRecording || isTracing || !isTracable}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-6 absolute left-1/2 -translate-x-1/2 group-hover:left-6 transition-all duration-300">
                <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
            </svg>
            <span className="opacity-0 group-hover:opacity-100 transition-[opacity] duration-300 ease-in whitespace-nowrap ml-8">追っかけ再開</span>
        </button>
    )
}

export { TraceStartButton }