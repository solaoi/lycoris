import { useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { SpeechHistory } from '../molecules/SpeechHistory'
import { useRecoilState } from 'recoil'
import { speechHistoryState } from '../../atoms/speechHistoryState'

const Main = (): JSX.Element => {
    const [partialText, setPartialText] = useState<string | null>(null)
    const [histories, setHistories] = useRecoilState(speechHistoryState)
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [histories]);

    useEffect(() => {
        let unlistenPartialText: any;
        let unlistenFinalText: any;

        async function f() {
            unlistenPartialText = await listen('partialTextRecognized', event => {
                setPartialText(event.payload as string)
            });

            unlistenFinalText = await listen('finalTextRecognized', event => {
                setPartialText(null)
                setHistories(prev => {
                    const current = event.payload as string
                    if (prev.length > 0) {
                        if (prev[prev.length - 1].content === current) {
                            return prev
                        }
                        return [...prev, { type: "speech", date: new Date(), content: event.payload as string }]
                    }
                    return [{ type: "speech", date: new Date(), content: event.payload as string }]
                })
            });
        }
        f();

        return () => {
            if (unlistenPartialText) unlistenPartialText();
            if (unlistenFinalText) unlistenFinalText();
        }
    }, [])
    return (
        <main>
            <div className="p-5">
                <SpeechHistory histories={histories} />
                <div className="ml-16 pb-1 mb-[72px]" ref={bottomRef} >{partialText}</div>
            </div>
        </main>
    )
}

export { Main }