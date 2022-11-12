import { useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { SpeechHistory } from '../molecules/SpeechHistory'
import { useRecoilState } from 'recoil'
import { speechHistoryAtom } from '../../store/atoms/speechHistoryAtom'
import { SpeechHistoryType } from '../../type/SpeechHistory.type'

const Main = (): JSX.Element => {
    const [partialText, setPartialText] = useState<string | null>(null)
    const [histories, setHistories] = useRecoilState(speechHistoryAtom)
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
        <main>
            <div className="p-5">
                <SpeechHistory histories={histories} />
                <div className="ml-16 pb-1 mb-[72px] text-gray-400" ref={bottomRef} >{partialText}</div>
            </div>
        </main>
    )
}

export { Main }