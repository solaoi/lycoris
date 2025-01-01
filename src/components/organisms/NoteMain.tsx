import { useCallback, useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { SpeechHistory } from '../molecules/SpeechHistory'
import { useRecoilState, useSetRecoilState } from 'recoil'
import { speechHistoryState } from '../../store/atoms/speechHistoryState'
import { SpeechHistoryType } from '../../type/SpeechHistory.type'
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
import { RecordPreparingButton } from '../molecules/RecordPreparingButton'
import { FilterTabs } from '../molecules/FilterTabs'
import { save } from "@tauri-apps/api/dialog";
import { writeTextFile } from "@tauri-apps/api/fs";
import dayjs from '../../lib/dayjs'
import { speechFilterState } from '../../store/atoms/speechFilterState'
import { invoke } from '@tauri-apps/api'
import { settingKeyState } from '../../store/atoms/settingKeyState'
import { Download } from '../atoms/Download'

const NoteMain = (): JSX.Element => {
    const filterTarget = useRecoilValue(speechFilterState);
    const transcriptionAccuracy = useRecoilValue(transcriptionAccuracyState)
    const [partialText, setPartialText] = useState<string | null>(null)
    const [partialTextDesktop, setPartialTextDesktop] = useState<string | null>(null)
    const [selectedNote, setSelectedNote] = useRecoilState(selectedNoteState)
    const recordingNote = useRecoilValue(recordingNoteState)
    const tracingNote = useRecoilValue(tracingNoteState)
    const setNotes = useSetRecoilState(notesState)
    const [histories, setHistories] = useRecoilState(speechHistoryState(selectedNote!.note_id))
    const isRecording = useRecoilValue(recordState);
    const [editTitle, setEditTitle] = useState(false);
    const isTracing = useRecoilValue(tracingState);
    const settingKeyOpenai = useRecoilValue(settingKeyState("settingKeyOpenai"));
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputEl = useRef<HTMLInputElement>(null);
    const [showGotoBottom, setShowGotoBottom] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const showGotoBottomButton = () => {
        const rect = bottomRef.current?.getBoundingClientRect();
        if (rect) {
            const isInViewport = rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
            if (!isInViewport) {
                setShowGotoBottom(true);
            } else {
                setShowGotoBottom(false);
            }
        }
    }
    const scroll = useCallback(() => {
        showGotoBottomButton();
    }, []);
    const [isReadyToRecognize, setIsReadyToRecognize] = useState(false);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            showGotoBottomButton();
            scrollContainer.addEventListener('scroll', scroll);
            return () => scrollContainer.removeEventListener('scroll', scroll);
        }
    }, [selectedNote]);

    useEffect(() => {
        if (recordingNote === selectedNote!.note_id) {
            const rect = bottomRef.current?.getBoundingClientRect();
            if (rect) {
                const isInViewport = rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
                if (isInViewport || histories.at(-1)?.speech_type === "screenshot") {
                    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    }, [histories, recordingNote]);

    useEffect(() => {
        setPartialText(null)
        setPartialTextDesktop(null)
        const unlistenPartialText = listen('partialTextRecognized', event => {
            if (recordingNote === selectedNote!.note_id) {
                const payload = event.payload as { content: string, is_desktop: boolean }
                if (payload.is_desktop) {
                    setPartialTextDesktop(payload.content)
                } else {
                    setPartialText(payload.content)
                }
            }
        });
        return () => {
            unlistenPartialText.then(f => f());
        }
    }, [selectedNote, recordingNote])

    useEffect(() => {
        const unlistenFinalText = listen('finalTextRecognized', event => {
            const { is_desktop, ...current } = event.payload as SpeechHistoryType & { is_desktop: boolean }
            if (is_desktop) {
                setPartialTextDesktop(null)
            } else {
                setPartialText(null)
            }
            setHistories(prev => {
                if (prev.length > 0 &&
                    prev[prev.length - 1].content === current.content) {
                    return prev;
                }

                return [...prev, current]
            })
        });
        const unlistenFinalTextConverted = listen('finalTextConverted', event => {
            const { id, content } = event.payload as { id: number, content: string }
            setHistories(prev => {
                if (settingKeyOpenai !== "" && prev.some(h => h.speech_type === "action" && !h.content_2)) {
                    invoke('execute_action_command', { noteId: recordingNote || tracingNote });
                }
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
    }, [recordingNote, isTracing, tracingNote])

    useEffect(() => {
        const unlistenScreenshotTaken = listen('screenshotTaken', event => {
            const current = event.payload as SpeechHistoryType
            setHistories(prev => {
                return [...prev, current]
            })
        });
        return () => {
            unlistenScreenshotTaken.then(f => f());
        }
    }, [selectedNote])

    useEffect(() => {
        const unlistenActionExecuted = listen('actionExecuted', event => {
            const { id, content } = event.payload as { id: number, content: string }
            setHistories(prev => {
                return prev.map(p => {
                    if (p.id === id) {
                        return {
                            ...p,
                            content_2: content,
                        }
                    }
                    return p;
                })
            })
        });
        return () => {
            unlistenActionExecuted.then(f => f());
        }
    }, [selectedNote])

    useEffect(() => {
        if (isRecording) {
            const unlistenReadyToRecognize = listen('readyToRecognize', () => {
                setIsReadyToRecognize(true);
            });
            return () => {
                unlistenReadyToRecognize.then(f => f());
            }
        } else {
            setIsReadyToRecognize(false);
            setPartialText(null);
            setPartialTextDesktop(null);
        }
    }, [isRecording])

    useEffect(() => {
        const resetPartialTexts = () => {
            setPartialText(null);
            setPartialTextDesktop(null);
        };

        const unlistenCompletion = listen('traceCompletion', resetPartialTexts);
        const unlistenUnCompletion = listen('traceUnCompletion', resetPartialTexts);

        return () => {
            unlistenCompletion.then(f => f());
            unlistenUnCompletion.then(f => f());
        }
    }, []);

    return (<>
        <div className="bg-white select-none">
            <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8 bg-white flex items-center group relative overflow-x-hidden" style={{ height: "64px" }} >
                <h1 className="overflow-hidden select-none text-ellipsis whitespace-nowrap text-2xl tracking-tight font-bold text-gray-600 flex-1 cursor-pointer mr-2 hover:border-base-300 border-2 border-transparent rounded-lg"
                    onDoubleClick={(e) => { e.preventDefault(); setEditTitle(true); }}>
                    {editTitle ?
                        <input className='w-full bg-base-200 focus:outline-none pl-1 tracking-normal' autoFocus value={selectedNote!.note_title} ref={inputEl}
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
                <div className="flex-none ml-1 mr-2">
                    {isTracing && tracingNote === selectedNote?.note_id ?
                        <TraceStopButton /> :
                        <TraceStartButton />}
                </div>
                <div className="flex-none">
                    {(isRecording && recordingNote === selectedNote?.note_id) ? isReadyToRecognize ? <RecordStopButton /> : <RecordPreparingButton /> : <RecordStartButton />}
                </div>
                <div className={`absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-red-100 opacity-40 ${(isRecording && recordingNote === selectedNote?.note_id) && "animate-shine"}`} />
                <div className={`absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-yellow-100 opacity-40 ${(isTracing && tracingNote === selectedNote?.note_id) && "animate-shine"}`} />
            </div>
            <div className="bg-white max-w-7xl mx-auto pl-2 py-2 flex items-center justify-between" style={{ height: "32px" }}>
                <FilterTabs />
                <div className="group mr-4">
                    <button className="text-slate-500 hover:text-slate-800" onClick={async () => {
                        const typeMapper = (speech_type: string) => {
                            switch (speech_type) {
                                case "speech":
                                    return "発言";
                                case "memo":
                                    return "メモ";
                                case "screenshot":
                                    return "スクリーンショット";
                                case "action":
                                    return "アクション";
                                default:
                                    return "不明";
                            }
                        }
                        const filterHistory = (speech_type: string) => {
                            if (filterTarget === "speech") {
                                if (speech_type === "speech") {
                                    return true;
                                }
                                return false;
                            } else if (filterTarget === "memo") {
                                if (speech_type === "memo") {
                                    return true;
                                }
                                return false;
                            } else if (filterTarget === "screenshot") {
                                if (speech_type === "screenshot") {
                                    return true;
                                }
                                return false;
                            } else if (filterTarget === "action") {
                                if (speech_type === "action") {
                                    return true;
                                }
                                return false;
                            }
                            return true;
                        }
                        const csvSuffix = (() => {
                            switch (filterTarget) {
                                case null:
                                    return "all";
                                case "speech":
                                    return "speech";
                                case "memo":
                                    return "memo";
                                case "screenshot":
                                    return "screenshot";
                                case "action":
                                    return "action";
                                default:
                                    return "unknown";
                            }
                        })();
                        const csvData = (() => {
                            if (settingKeyOpenai !== "") {
                                return "日付,種別,内容1,内容2\n" + histories.filter(h => filterHistory(h.speech_type)).map(h => `${dayjs.unix(h.created_at_unixtime).format('YYYY-M-D H:mm')},${typeMapper(h.speech_type)},"${h.content}","${h.content_2 || ""}"`).join("\n");
                            } else if (histories.some(h => h.speech_type === "action")) {
                                return "日付,種別,内容1,内容2\n" + histories.filter(h => filterHistory(h.speech_type)).map(h => `${dayjs.unix(h.created_at_unixtime).format('YYYY-M-D H:mm')},${typeMapper(h.speech_type)},"${h.content}","${h.content_2 || ""}"`).join("\n");
                            } else {
                                return "日付,種別,内容\n" + histories.filter(h => filterHistory(h.speech_type)).map(h => `${dayjs.unix(h.created_at_unixtime).format('YYYY-M-D H:mm')},${typeMapper(h.speech_type)},"${h.content}"`).join("\n");
                            }
                        })()
                        const path = await save({ defaultPath: `${selectedNote?.note_title.trim()}_${csvSuffix}.csv` });
                        if (path) {
                            await writeTextFile(path, csvData);
                        }
                    }}>
                        <Download />
                    </button>
                    <div className="w-20 invisible rounded text-[12px]
                        font-bold text-white py-1 bg-slate-600 top-[154px] right-4
                        group-hover:visible absolute text-center">ダウンロード
                    </div>
                </div>
            </div>
        </div>
        <div className="p-5 overflow-auto z-0" style={{ height: `calc(100vh - 160px)` }} ref={scrollContainerRef}>
            <SpeechHistory histories={histories} setHistories={setHistories} />
            <div className="ml-[3.75rem] mb-[243px] text-gray-400" ref={bottomRef} >
                {partialTextDesktop !== null && partialText !== null && <div className='flex flex-col'>
                    <div className="flex items-start"><span className="loading loading-ring loading-xs mr-[5px] mt-1 flex-none"></span><p>デスクトップ音声：{partialTextDesktop}</p></div>
                    <div className="flex items-start"><span className="loading loading-ring loading-xs mr-[5px] mt-1 flex-none"></span><p>マイク音声：{partialText}</p></div>
                </div>}
                {partialTextDesktop !== null && partialText === null && <div className="flex items-start"><span className="loading loading-ring loading-xs mr-[5px] mt-1 flex-none"></span><p>{partialTextDesktop}</p></div>}
                {partialTextDesktop === null && partialText !== null && <div className="flex items-start"><span className="loading loading-ring loading-xs mr-[5px] mt-1 flex-none"></span><p>{partialText}</p></div>}
            </div>
            <NoteFooter titleRef={inputEl} />
        </div>
        <div className="flex justify-center items-center w-8 h-8 fixed bottom-0 right-0 mb-1 mr-[1.4rem] bg-base-200 rounded-lg drop-shadow-lg cursor-pointer hover:bg-base-300"
            style={!showGotoBottom ? { display: "none" } : {}}
            onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={"w-6 h-6"}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
            </svg>
        </div>
    </>)
}

export { NoteMain }