import { useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { SpeechHistory } from '../molecules/SpeechHistory'
import { useRecoilState, useSetRecoilState } from 'recoil'
import { speechHistoryState } from '../../store/atoms/speechHistoryState'
import { SpeechHistoryType } from '../../type/SpeechHistory.type'
import { MemoFilterButton } from '../molecules/MemoFilterButton'
import { RecordStopButton } from '../molecules/RecordStopButton'
import { RecordStartButton } from '../molecules/RecordStartButton'
import { useRecoilValue } from "recoil"
import { recordState } from "../../store/atoms/recordState"
import { NoteFooter } from './NoteFooter'
import { transcriptionAccuracyState } from '../../store/atoms/transcriptionAccuracyState'
import { selectedNoteState } from '../../store/atoms/selectedNoteState'
import { notesState } from '../../store/atoms/notesState'
import { recordingNoteState } from '../../store/atoms/recordingNoteState'
import { TraceStartButton } from '../molecules/TraceStartButton'
import { TraceStopButton } from '../molecules/TraceStopButton'
import { tracingState } from '../../store/atoms/tracingState'
import { tracingNoteState } from '../../store/atoms/tracingNoteState'

const NoteMain = (): JSX.Element => {
    const transcriptionAccuracy = useRecoilValue(transcriptionAccuracyState)
    const [partialText, setPartialText] = useState<string | null>(null)
    const [selectedNote, setSelectedNote] = useRecoilState(selectedNoteState)
    const recordingNote = useRecoilValue(recordingNoteState)
    const tracingNote = useRecoilValue(tracingNoteState)
    const setNotes = useSetRecoilState(notesState)
    const [histories, setHistories] = useRecoilState(speechHistoryState(selectedNote!.note_id))
    const isRecording = useRecoilValue(recordState);
    const [editTitle, setEditTitle] = useState(false);
    const isTracing = useRecoilValue(tracingState);
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (recordingNote === selectedNote!.note_id) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [histories, recordingNote]);
    useEffect(() => {
        setPartialText(null)
        const unlistenPartialText = listen('partialTextRecognized', event => {
            if (recordingNote === selectedNote!.note_id) {
                setPartialText(event.payload as string)
            }
        });
        return () => {
            unlistenPartialText.then(f => f());
        }
    }, [selectedNote, recordingNote])
    useEffect(() => {
        const unlistenFinalText = listen('finalTextRecognized', event => {
            setPartialText(null)
            const current = event.payload as SpeechHistoryType
            setHistories(prev => {
                if (prev.length > 0 && (prev[prev.length - 1].content === current.content)) {
                    return prev;
                }

                return [...prev, current]
            })
        });
        const unlistenFinalTextConverted = listen('finalTextConverted', event => {
            const { id, content } = event.payload as { id: number, content: string }
            setHistories(prev => {
                return prev.map(p => {
                    if (p.id === id) {
                        return {
                            ...p,
                            content,
                            model: "whisper",
                            model_description: transcriptionAccuracy!
                        }
                    }
                    return p;
                })
            })
        });
        return () => {
            unlistenFinalText.then(f => f());
            unlistenFinalTextConverted.then(f => f());
        }
    }, [recordingNote, isTracing])

    return (<>
        <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8 bg-white flex items-center group relative overflow-x-hidden" style={{ height: "64px" }}>
            <h1 className="overflow-hidden select-none text-ellipsis whitespace-nowrap text-2xl tracking-tight font-bold text-gray-600 flex-1 cursor-pointer mr-2 hover:border-base-300 border-2 border-transparent rounded-lg"
                onDoubleClick={(e) => { e.preventDefault(); setEditTitle(true); }}>
                {editTitle ?
                    <input className='w-full bg-base-200 focus:outline-none pl-1 tracking-normal' autoFocus value={selectedNote!.note_title}
                        onKeyDown={e => {
                            if (e.key === "Enter" && e.keyCode === 13) {
                                setEditTitle(false)
                            }
                        }}
                        onBlur={() => { setEditTitle(false) }}
                        onChange={(e) => {
                            const target = e.target.value
                            setSelectedNote(prev => { return { ...prev!, note_title: target } });
                            setNotes(prev => prev.map(note => {
                                if (note.id === selectedNote!.note_id) {
                                    return { ...note, note_title: target }
                                } else {
                                    return note;
                                }
                            }))
                        }} />
                    : <p className='pl-1 tracking-normal'>{selectedNote!.note_title}</p>}
            </h1>
            <div className="flex-none mr-2">
                {isTracing && tracingNote === selectedNote?.note_id ?
                    <TraceStopButton /> :
                    <TraceStartButton />}
            </div>
            <div className="flex-none">
                {(isRecording && recordingNote === selectedNote?.note_id) ? <RecordStopButton /> : <RecordStartButton />}
            </div>
            <div className={`absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-red-100 opacity-40 ${(isRecording && recordingNote === selectedNote?.note_id) && "animate-shine"}`} />
            <div className={`absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-yellow-100 opacity-40 ${(isTracing && tracingNote === selectedNote?.note_id) && "animate-shine"}`} />
        </div>
        <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8 bg-white flex items-center border-t" style={{ height: "32px" }}>
            フィルター：
            <MemoFilterButton />
        </div>
        <div className="p-5 overflow-auto" style={{ height: `calc(100vh - 160px)` }}>
            <SpeechHistory histories={histories} />
            <div className="ml-16 mb-[147px] text-gray-400" ref={bottomRef} >{partialText}</div>
            <NoteFooter />
        </div>
    </>)
}

export { NoteMain }