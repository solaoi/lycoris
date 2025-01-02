import { invoke } from "@tauri-apps/api";
import { useEffect, useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { lengthScaleState } from "../../store/atoms/smartVoices/lengthScaleState";
import { sdpRatioState } from "../../store/atoms/smartVoices/sdpRatioState";
import { smartVoiceState } from "../../store/atoms/smartVoices/smartVoiceState";

type SuggestCardProps = {
    id: number,
    active: string,
    suggestions: string,
    update: (id: number, active: string) => void
}

const SuggestCard = ({ id, active, suggestions, update }: SuggestCardProps) => {
    const lengthScale = useRecoilValue(lengthScaleState)
    const sdpRatio = useRecoilValue(sdpRatioState)
    const selectedModel = useRecoilValue(smartVoiceState)

    const obj = (() => {
        try {
            return JSON.parse(suggestions) as { [key in "neutral" | "positive" | "negative"]: { content: string, reason: string } }
        } catch (e) {
            return null;
        }
    })();
    if (obj === null) {
        return <div>発話サジェストに失敗しました。</div>
    }
    const { neutral, positive, negative } = obj;

    const [audio, setAudio] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    useEffect(() => {
        return () => {
            if (audio) {
                URL.revokeObjectURL(audio);
            }
        };
    }, [])
    const synthesize = async (text: string) => {
        if (!text.length) return;
        setIsLoading(true);

        invoke('synthesize_command', { text, sdpRatio, lengthScale })
            .then(buffer => {
                const res = new Blob([new Uint8Array(buffer as ArrayBufferLike)], { type: "audio/wav" });
                setAudio((prev) => {
                    if (prev !== null) URL.revokeObjectURL(prev);
                    setIsLoading(false);
                    return URL.createObjectURL(res)
                });
            });
    };
    const playAudio = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (audioRef.current) {
            try {
                await audioRef.current.play();
            } catch (error) {
                console.error('Audio playback failed:', error);
            }
        }
    }
    type ActiveType = "neutral" | "positive" | "negative";
    const activateCard = async (a: ActiveType) => {
        if (active === a) return;
        update(id, a);
        if (selectedModel !== "off") {
            const content =
                a === "neutral" ? neutral.content :
                    a === "positive" ? positive.content :
                        negative.content;
            await synthesize(content);
        }
    }
    const isAudioLoading = (a: ActiveType) => {
        return a === active && isLoading;
    };

    return (
        <div className="suggest-card flex gap-2 my-3">
            {audio && <audio className="hidden" controls src={audio} ref={audioRef}></audio>}
            <div className={"mr-1 cursor-pointer h-full border border-solid border-neutral-300 rounded-md p-5 duration-200 hover:scale-105 hover:shadow hover:bg-white" + (active === "neutral" ? " scale-105 shadow mr-2" : " bg-base-100")}
                onClick={async () => await activateCard("neutral")}>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold">ニュートラル</p>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM7 8.5c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S5.448 7 6 7s1 .672 1 1.5Zm5 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S10.448 7 11 7s1 .672 1 1.5Zm-6.5 5.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{neutral.content}</p>
                        {selectedModel !== "off" && <div className="flex justify-center mt-2">
                            {isAudioLoading("neutral") ?
                                <span className="loading loading-spinner loading-md"></span>
                                :
                                <button className={"btn gap-2 bg-white border border-solid border-neutral-300 text-primary" + (active === "neutral" ? "" : " btn-disabled")} onClick={playAudio}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                        <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.841Z" />
                                    </svg>
                                    再生
                                </button>
                            }
                        </div>}
                        {active === "neutral" && <>
                            <hr className="mb-4 mt-2" />
                            <p className="text-xs font-medium">{neutral.reason}</p>
                        </>}
                    </div>
                </div>
            </div>

            <div className={"mr-1 cursor-pointer h-full border border-solid border-neutral-300 rounded-md p-5 duration-200 hover:scale-105 hover:shadow hover:bg-white" + (active === "positive" ? " scale-105 shadow mr-3 ml-2" : " bg-base-100")}
                onClick={async () => await activateCard("positive")}>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-primary mb-2">
                        <p className="text-xs font-semibold">ポジティブ</p>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.536-4.464a.75.75 0 1 0-1.061-1.061 3.5 3.5 0 0 1-4.95 0 .75.75 0 0 0-1.06 1.06 5 5 0 0 0 7.07 0ZM9 8.5c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S7.448 7 8 7s1 .672 1 1.5Zm3 1.5c.552 0 1-.672 1-1.5S12.552 7 12 7s-1 .672-1 1.5.448 1.5 1 1.5Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{positive.content}</p>
                        {selectedModel !== "off" && <div className="flex justify-center mt-2">
                            {isAudioLoading("positive") ?
                                <span className="loading loading-spinner loading-md"></span>
                                :
                                <button className={"btn gap-2 bg-white border border-solid border-neutral-300 text-primary" + (active === "positive" ? "" : " btn-disabled")} onClick={playAudio}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                        <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.841Z" />
                                    </svg>
                                    再生
                                </button>
                            }
                        </div>}
                        {active === "positive" && <>
                            <hr className="mb-4 mt-2" />
                            <p className="text-xs font-medium">{positive.reason}</p>
                        </>}
                    </div>
                </div>
            </div>

            <div className={"cursor-pointer h-full border border-solid border-neutral-300 rounded-md p-5 duration-200 hover:scale-105 hover:shadow hover:bg-white" + (active === "negative" ? " scale-105 shadow ml-2" : " bg-base-100")}
                onClick={async () => await activateCard("negative")}>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-error mb-2">
                        <p className="text-xs font-semibold">ネガティブ</p>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-3.536-3.475a.75.75 0 0 0 1.061 0 3.5 3.5 0 0 1 4.95 0 .75.75 0 1 0 1.06-1.06 5 5 0 0 0-7.07 0 .75.75 0 0 0 0 1.06ZM9 8.5c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S7.448 7 8 7s1 .672 1 1.5Zm3 1.5c.552 0 1-.672 1-1.5S12.552 7 12 7s-1 .672-1 1.5.448 1.5 1 1.5Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{negative.content}</p>
                        {selectedModel !== "off" && <div className="flex justify-center mt-2">
                            {isAudioLoading("negative") ?
                                <span className="loading loading-spinner loading-md"></span>
                                :
                                <button className={"btn gap-2 bg-white border border-solid border-neutral-300 text-primary" + (active === "negative" ? "" : " btn-disabled")} onClick={playAudio}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                        <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.841Z" />
                                    </svg>
                                    再生
                                </button>
                            }
                        </div>}
                        {active === "negative" && <>
                            <hr className="mb-4 mt-2" />
                            <p className="text-xs font-medium">{negative.reason}</p>
                        </>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export { SuggestCard }
