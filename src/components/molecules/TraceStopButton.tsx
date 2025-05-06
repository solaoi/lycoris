import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
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
        <button className="btn gap-2 bg-white border border-solid border-neutral-300 text-secondary" onClick={click} disabled={transcriptionAccuracy === "off"}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
            </svg>
            追っかけ停止
        </button>
    )
}

export { TraceStopButton }