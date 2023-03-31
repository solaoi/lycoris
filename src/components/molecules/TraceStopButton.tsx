import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';
import { useEffect } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { traceState } from '../../store/atoms/traceState';
import { tracingNoteState } from '../../store/atoms/tracingNoteState';
import { tracingState } from '../../store/atoms/tracingState';
import { transcriptionAccuracyState } from '../../store/atoms/transcriptionAccuracyState';

const TraceStopButton = (): JSX.Element => {
    const transcriptionAccuracy = useRecoilValue(transcriptionAccuracyState);
    const setTracing = useSetRecoilState(tracingState);
    const [tracingNote, setTracingNote] = useRecoilState(tracingNoteState);
    const setTracable = useSetRecoilState(traceState(tracingNote!));
    const click = () => {
        setTracing(false)
        setTracingNote(null)
        invoke('stop_trace_command')
    }
    useEffect(() => {
        const unlisten = listen('traceCompletion', () => {
            setTracing(false)
            setTracingNote(null)
            setTracable(false)
        })
        return () => {
            unlisten.then(f => f());
        }
    }, [])

    return (
        <button className="btn gap-2 glass text-secondary" onClick={click} disabled={transcriptionAccuracy === "off"}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
            </svg>
            追っかけ停止
        </button>
    )
}

export { TraceStopButton }