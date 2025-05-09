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
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import dayjs from '../../lib/dayjs'
import { speechFilterState } from '../../store/atoms/speechFilterState'
import { invoke } from "@tauri-apps/api/core"
import { settingKeyState } from '../../store/atoms/settingKeyState'
import { Download } from '../atoms/Download'
import { ChevronDown } from '../atoms/ChevronDown'
import { toast } from 'react-toastify'
import { settingSlackSendTraceMessageEnabledState } from '../../store/atoms/settingSlackSendTraceMessageEnabledState'
import { settingDiscordSendTraceMessageEnabledState } from '../../store/atoms/settingDiscordSendTraceMessageEnabledState'
import { AgentSelectButton } from '../molecules/AgentSelectButton'
import { Agent } from '../../type/Agent.type'
import { AgentSwitcherTabs } from '../molecules/AgentSwitcherTabs'
import { agentSelectedState } from '../../store/atoms/agentSelectedState'
import { agentSwitcherState } from '../../store/atoms/agentSwitcherState'
import { AgentHistory } from '../molecules/AgentHistory'
import { agentHistoryState } from '../../store/atoms/agentHistoryState'
import { agentsWithNoteState } from '../../store/atoms/agentsWithNoteState'
import { agentWorkspaceState } from '../../store/atoms/agentWorkspaceState'
import { AgentTabs } from '../molecules/AgentTabs'
import { AgentWorkspace } from '../molecules/AgentWorkspace'
import { agentTabState } from '../../store/atoms/agentTabState'
import { emotionWithNoteState } from '../../store/atoms/emotionWithNoteState'
import { modelKushinadaDownloadedState } from '../../store/atoms/modelKushinadaDownloadedState'

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
    const slackSendTraceMessageEnabled = useRecoilValue(settingSlackSendTraceMessageEnabledState);
    const discordSendTraceMessageEnabled = useRecoilValue(settingDiscordSendTraceMessageEnabledState);
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
        } else if (recordingNote === null) {
            const rect = bottomRef.current?.getBoundingClientRect();
            if (rect) {
                const isInViewport = rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
                if (isInViewport) {
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

    const [hasEmotion, setHasEmotion] = useRecoilState(emotionWithNoteState(selectedNote!.note_id))
    const emotionKeysRef = useRef<number[]>([]);
    const latestEmotionsRef = useRef<{ [speechId: number]: number }>({});
    useEffect(() => {
        emotionKeysRef.current = []
        latestEmotionsRef.current = {}
    }, [recordingNote, tracingNote]);

    useEffect(() => {
        const unlistenFinalText = listen('finalTextRecognized', event => {
            if (hasEmotion === 1) {
                invoke('execute_emotion_command', {})
            }
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
                if (settingKeyOpenai !== "" && transcriptionAccuracy !== "off" && selectedAgent.length > 0) {
                    invoke('execute_agent_command', { noteId: recordingNote || tracingNote, agents: selectedAgent });
                }
                return prev.map(p => {
                    let newP = { ...p };
                    if (hasEmotion === 1 && p.id !== undefined) {
                        const emotionVal = latestEmotionsRef.current[p.id];
                        if (emotionVal !== undefined) {
                            newP.is_done_with_emotion = emotionVal;
                            delete latestEmotionsRef.current[p.id];
                        }
                    }

                    if (p.id === id) {
                        if (p.content !== content) {
                            if (slackSendTraceMessageEnabled === 1) {
                                invoke('send_slack_message_command', { content })
                                    .catch(e => {
                                        console.error(`Slackメッセージの送信に失敗しました: ${e}`)
                                        toast.error("Slackメッセージの送信に失敗しました", {
                                            pauseOnFocusLoss: false,
                                            autoClose: 2500
                                        });
                                    });
                            }
                            if (discordSendTraceMessageEnabled === 1) {
                                invoke('send_discord_message_command', { content })
                                    .catch(e => {
                                        console.error(`Discordメッセージの送信に失敗しました: ${e}`)
                                        toast.error("Discordメッセージの送信に失敗しました", {
                                            pauseOnFocusLoss: false,
                                            autoClose: 2500
                                        });
                                    });
                            }
                        }
                        newP = {
                            ...newP,
                            content,
                            model: "whisper",
                            model_description: transcriptionAccuracy!,
                        }
                    }

                    return newP;
                })
            })
        });
        const unlistenEmotionAnalyzed = listen('emotionAnalyzed', event => {
            const { id, emotion } = event.payload as { id: number, emotion: number }
            latestEmotionsRef.current[id] = emotion;
            if (!emotionKeysRef.current.includes(id)) {
                emotionKeysRef.current.push(id);
            }
            while (emotionKeysRef.current.length > 20) {
                const oldKey = emotionKeysRef.current.shift();
                if (oldKey !== undefined) {
                    delete latestEmotionsRef.current[oldKey];
                }
            }
        });
        return () => {
            unlistenFinalText.then(f => f());
            unlistenFinalTextConverted.then(f => f());
            unlistenEmotionAnalyzed.then(f => f());
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

    const [agents, setAgents] = useState<Agent[]>([]);
    const selectedAgent = useRecoilValue(agentSelectedState)
    useEffect(() => {
        invoke("select_all_agents_command").then((value: unknown) => {
            const agents = value as Agent[];
            setAgents(agents);
        });
    }, [])
    const agentSwitcher = useRecoilValue(agentSwitcherState)
    const [agentHistories, setAgentHistories] = useRecoilState(agentHistoryState(selectedNote!.note_id))
    const [agentWorkspaces, setAgentWorkspaces] = useRecoilState(agentWorkspaceState(selectedNote!.note_id))
    const [agentIdsWithNote, setAgentIdsWithNote] = useRecoilState(agentsWithNoteState(selectedNote!.note_id))
    useEffect(() => {
        setAgentIdsWithNote([])
    }, [selectedNote, isRecording, isTracing])
    useEffect(() => {
        const unlistenAgentHandled = agents.length > 0 ? listen('agentHandled', (event) => {
            const agent = event.payload as { id: number, speech_id: number, agent_id: number, content: string, created_at_unixtime: number, note_id: number }
            setAgentHistories(prev => {
                return [...prev, agent]
            })
        }) : null;
        const unlistenAgentWorkspaceHandled = agents.length > 0 ? listen('agentWorkspaceHandled', (event) => {
            const workspace = event.payload as { id: number, agent_id: number, content: string, created_at_unixtime: number, note_id: number }

            setAgentWorkspaces(prev => {
                if (prev.some(p => p.id === workspace.id)) {
                    return prev.map(p => {
                        if (p.id === workspace.id) {
                            return workspace
                        }
                        return p
                    })
                } else {
                    return [...prev, workspace]
                }
            })
        }) : null;
        return () => {
            if (agents.length > 0) {
                unlistenAgentHandled!.then(f => f());
                unlistenAgentWorkspaceHandled!.then(f => f());
            }
        }
    }, [agents, selectedNote, setAgentHistories])
    const agentTab = useRecoilValue(agentTabState)
    const downloadedModels = useRecoilValue(modelKushinadaDownloadedState);
    const is_kushinada_downloaded = downloadedModels.filter(m => m === "kushinada-hubert-large-jtes-er").length > 0;

    return (<>
        <div className="bg-white">
            <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8 bg-white flex items-center relative overflow-x-hidden h-[64px]" >
                <h1 className="overflow-hidden text-ellipsis whitespace-nowrap text-2xl tracking-tight font-bold text-gray-600 flex-1 cursor-pointer mr-2 !pl-0 hover:border-base-300 border-2 border-transparent rounded-lg"
                    onDoubleClick={(e) => { e.preventDefault(); setEditTitle(true); }}>
                    {editTitle ?
                        <input className='w-full bg-base-200 rounded-md focus:outline-none pl-1 tracking-normal' autoFocus value={selectedNote!.note_title} ref={inputEl}
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
                <div className="flex-none ml-1 mr-2 flex gap-2">
                    <AgentSelectButton agents={agents} />
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
            {(agentIdsWithNote.length > 0 || selectedAgent.length > 0) && (<div className="bg-white pb-1">
                <div className='bg-white max-w-7xl mx-auto pl-2 py-2 flex items-center justify-between h-[32px]' >
                    <AgentSwitcherTabs agents={agents} selectedAgent={selectedAgent} agentIdsWithNote={agentIdsWithNote} />
                </div>
            </div>
            )}
            <div className={`bg-white max-w-7xl mx-auto pl-2 py-2 flex items-center justify-between h-[32px] drop-shadow-sm ${agentSwitcher !== null ? "hidden" : ""}`} >
                <FilterTabs />
                <div className='flex gap-2 items-center'>
                    {is_kushinada_downloaded && <div className="group">
                        <label className="cursor-pointer label">
                            <span className="label-text inline-flex mr-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.536-4.464a.75.75 0 1 0-1.061-1.061 3.5 3.5 0 0 1-4.95 0 .75.75 0 0 0-1.06 1.06 5 5 0 0 0 7.07 0ZM9 8.5c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S7.448 7 8 7s1 .672 1 1.5Zm3 1.5c.552 0 1-.672 1-1.5S12.552 7 12 7s-1 .672-1 1.5.448 1.5 1 1.5Z" clipRule="evenodd" />
                                </svg>
                            </span>
                            <input type="checkbox" className="toggle toggle-accent" checked={hasEmotion === 1} onChange={(e) => {
                                if (isRecording) {
                                    return;
                                }
                                setHasEmotion(e.target.checked ? 1 : 0)
                            }} />
                        </label>
                        <div className="w-16 invisible rounded text-[12px]
                        font-bold text-white py-1 bg-slate-600 right-14
                        group-hover:visible absolute text-center z-10" style={{ top: (agentIdsWithNote.length > 0 || selectedAgent.length > 0) ? "194px" : "158px" }}>感情分析
                        </div>
                    </div>}
                    <div className="flex group mr-4">
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
                        font-bold text-white py-1 bg-slate-600 right-7
                        group-hover:visible absolute text-center z-10" style={{ top: (agentIdsWithNote.length > 0 || selectedAgent.length > 0) ? "194px" : "158px" }}>ダウンロード
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className={`px-5 pb-5 overflow-auto z-0 ${agentSwitcher !== null ? "hidden" : ""}`} style={{ height: (agentIdsWithNote.length > 0 || selectedAgent.length > 0) ? `calc(100vh - 192px)` : `calc(100vh - 160px)` }} ref={scrollContainerRef}>
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
        <div className={`bg-white max-w-7xl mx-auto pl-2 py-2 flex items-center justify-between h-[32px] drop-shadow-sm`} >
            <AgentTabs agents={agents} agentId={agentSwitcher} />
        </div>
        <div className={`px-5 pb-5 overflow-auto z-0 ${agentSwitcher === null ? "hidden" : ""}`} style={{ height: `calc(100vh - 192px)` }} ref={scrollContainerRef}>
            <div className={`${agentTab === "workspace" ? "" : "hidden"}`}>
                <AgentWorkspace agent_id={agentSwitcher ?? 0} workspaces={agentWorkspaces} note_title={selectedNote?.note_title ?? ""} />
            </div>
            <div className={`${agentTab !== "workspace" ? "" : "hidden"}`}>
                <AgentHistory agent_id={agentSwitcher ?? 0} histories={agentHistories} />
            </div>
        </div>
        <div className="flex justify-center items-center w-8 h-8 fixed bottom-0 right-0 mb-1 mr-[1.4rem] bg-white/80 drop-shadow-md rounded-full cursor-pointer hover:bg-base-200"
            style={!showGotoBottom ? { display: "none" } : {}}
            onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }}>
            <ChevronDown />
        </div>
    </>)
}

export { NoteMain }