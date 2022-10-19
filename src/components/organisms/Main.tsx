import { useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { SpeechHistory } from '../molecules/SpeechHistory'
import { useRecoilState } from 'recoil'
import { speechHistoryAtom } from '../../store/atoms/speechHistoryAtom'

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

        async function f() {
            unlistenPartialText = await listen('partialTextRecognized', event => {
                setPartialText(event.payload as string)
            });

            unlistenFinalText = await listen('finalTextRecognized', async event => {
                setPartialText(null)
                const current = event.payload as { text: string, wav: string }
                setHistories(prev => {
                    if (prev.length > 0 && (prev[prev.length - 1].content === current.text)) {
                        return prev;
                    }

                    return [...prev, {
                        speech_type: "speech",
                        unix_time: new Date().getTime(),
                        content: current.text,
                        wav: current.wav
                    }]
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