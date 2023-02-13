import { useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { SpeechHistory } from '../molecules/SpeechHistory'
import { useRecoilState } from 'recoil'
import { speechHistoryAtom } from '../../store/atoms/speechHistoryAtom'
import { SpeechHistoryType } from '../../type/SpeechHistory.type'
import { MemoFilterButton } from '../molecules/MemoFilterButton'
import { RecordStopButton } from '../molecules/RecordStopButton'
import { RecordStartButton } from '../molecules/RecordStartButton'
import { useRecoilValue } from "recoil"
import { recordState } from "../../store/atoms/recordState"
import { NoteFooter } from './NoteFooter'

const NoteMain = (): JSX.Element => {
    const [partialText, setPartialText] = useState<string | null>(null)
    const [histories, setHistories] = useRecoilState(speechHistoryAtom)
    const isRecording = useRecoilValue(recordState)
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [histories]);
    useEffect(() => {
        let unlistenPartialText: any;
        let unlistenFinalText: any;
        let unlistenFinalTextConverted: any;

        async function f() {
            unlistenPartialText = await listen('partialTextRecognized', event => {
                setPartialText(event.payload as string)
            });

            unlistenFinalText = await listen('finalTextRecognized', async event => {
                setPartialText(null)
                const current = event.payload as SpeechHistoryType
                setHistories(prev => {
                    if (prev.length > 0 && (prev[prev.length - 1].content === current.content)) {
                        return prev;
                    }

                    return [...prev, current]
                })
            });

            unlistenFinalTextConverted = await listen('finalTextConverted', async event => {
                const { id, content } = event.payload as { id: number, content: string }
                setHistories(prev => {
                    return prev.map(p => {
                        if (p.id === id) {
                            return {
                                ...p,
                                content,
                                model: "whisper-small"
                            }
                        }
                        return p;
                    })
                })
            });
        }
        f();

        return () => {
            if (unlistenPartialText) unlistenPartialText();
            if (unlistenFinalText) unlistenFinalText();
            if (unlistenFinalTextConverted) unlistenFinalTextConverted();
        }
    }, [])

    return (
        <>
            <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8 bg-white flex items-center group relative overflow-x-hidden" style={{ height: "64px" }}>
                <h1 className="overflow-hidden text-ellipsis whitespace-nowrap text-3xl tracking-tight font-bold text-gray-900 flex-1">
                    ノート1
                </h1>
                <div className="flex-none">
                    {isRecording ? <RecordStopButton /> : <RecordStartButton />}
                </div>
                {/* shine box */}
                <div className={`absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-red-100 opacity-40 ${isRecording && "animate-shine"}`} />
            </div>
            <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8 bg-white flex items-center border-t" style={{ height: "32px" }}>
                <MemoFilterButton />
            </div>
            <div className="p-5 overflow-auto" style={{ height: `calc(100vh - 160px)` }}>
                <SpeechHistory histories={histories} />
                <div className="ml-16 pb-1 mb-[72px] text-gray-400" ref={bottomRef} >{partialText}</div>
                <NoteFooter />
            </div>
        </>
    )
}

export { NoteMain }