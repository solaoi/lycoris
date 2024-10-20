import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRecoilState } from 'recoil';
import { lengthScaleState } from "../../store/atoms/smartVoices/lengthScaleState";
import { sdpRatioState } from "../../store/atoms/smartVoices/sdpRatioState";
import { smartVoiceState } from "../../store/atoms/smartVoices/smartVoiceState";
import { invoke } from "@tauri-apps/api";

const SmartVoice = (): JSX.Element => {
    const [models, setModels] = useState([] as string[])
    const [toggle, setToggle] = useState(false)
    useEffect(() => {
        invoke('list_synthesize_models_command').then(models => setModels(models as string[]))
    }, [toggle])
    const defaultModels = ["jvnv-F1-jp", "jvnv-F2-jp", "jvnv-M1-jp", "jvnv-M2-jp", "tsukuyomi-chan", "koharune-ami", "amitaro"]
    const [lengthScale, setLengthScale] = useRecoilState(lengthScaleState)
    const [sdpRatio, setSdpRatio] = useRecoilState(sdpRatioState)
    const [selectedModel, setSelectedModel] = useRecoilState(smartVoiceState)
    const [isLoading, setIsLoading] = useState(false)

    const dropdownRef = useRef<HTMLLabelElement>(null)

    const change = (e: ChangeEvent<HTMLInputElement>) => {
        dropdownRef.current?.focus();
        if (e.target.checked) {
            setIsLoading(true)
            const value = e.target.value
            if (value === "off") {
                invoke('synthesize_finalize_command')
                    .then(() => {
                        setSelectedModel(value)
                        setIsLoading(false)
                    })
            } else {
                invoke('synthesize_init_command', { model: value })
                    .then(() => {
                        setSelectedModel(value)
                        setIsLoading(false)
                    })
            }
        }
    }

    const checkAndCloseDropDown = (target: EventTarget & HTMLLabelElement) => {
        setToggle(!toggle)
        if (target && target.matches(':focus')) {
            setTimeout(() => target.blur(), 0);
        }
    }

    const mapModel = (model: string) => {
        switch (model) {
            case "off":
                return "オフ";
            case "jvnv-F1-jp":
                return "女性1";
            case "jvnv-F2-jp":
                return "女性2";
            case "jvnv-M1-jp":
                return "男性1";
            case "jvnv-M2-jp":
                return "男性2";
            case "tsukuyomi-chan":
                return "つくよみちゃん";
            case "koharune-ami":
                return "小春音アミ";
            case "amitaro":
                return "あみたろ";
            default:
                return model;
        }
    }

    return (
        <div className="dropdown">
            <label ref={dropdownRef} onMouseDown={e => checkAndCloseDropDown(e.currentTarget)} tabIndex={0} className="group normal-case btn w-52 flex justify-between" style={{ color: "inherit", backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }} >
                <div className="w-36 text-left overflow-x-hidden whitespace-nowrap text-ellipsis">{selectedModel === null ? "スマート読み上げ" : mapModel(selectedModel)}</div>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="opacity-0 w-28 invisible rounded text-[12px] 
                        font-bold text-white py-1 bg-slate-600 top-12 left-4
                        group-hover:visible opacity-100 absolute ">スマート読み上げ
                </div>
            </label>
            <ul tabIndex={0} className="dropdown-content menu rounded-box w-60"
                style={{ backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}
            >
                <ul className="max-h-56 overflow-y-scroll rounded-box scrollbar-transparent" style={selectedModel !== "off" || (isLoading && selectedModel === "off") ? { paddingBottom: "0.5rem" } : {}}>
                    <li key="transcription-accuracy_off">
                        <label className="label inline-flex active:!bg-inherit">
                            <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="off" checked={selectedModel === "off"} />
                            <a className="grow">オフ</a>
                        </label>
                    </li>
                    {models.length > 0 && <>
                        {models
                            .filter(m => defaultModels.includes(m))
                            .sort((a, b) => {
                                return a.localeCompare(b, 'ja');
                            })
                            .map((model, i) => (
                                <>
                                    {i === 0 && <>
                                        <hr className="my-2" />
                                        <div className="flex justify-center sticky top-0 z-10 w-full mb-2" style={{ backgroundColor: "hsl(24 33% 97%)" }}>
                                            <p className="text-xs text-gray-400">デフォルト</p>
                                        </div>
                                    </>}
                                    <li key={"smart-voice_" + i}>
                                        <label className="label inline-flex active:!bg-inherit">
                                            <input disabled={isLoading} type="radio" name="voice-option" className="radio radio-accent" onChange={change} value={model} checked={model === selectedModel} />
                                            <a className="grow">{mapModel(model)}</a>
                                        </label>
                                    </li>
                                </>
                            ))
                        }
                        {models
                            .filter(m => !defaultModels.includes(m))
                            .sort((a, b) => {
                                return a.localeCompare(b, 'ja');
                            })
                            .map((model, i) => (
                                <>
                                    {i === 0 && <>
                                        <hr className="my-2" />
                                        <div className="flex justify-center sticky top-0 z-10 w-full mb-2" style={{ backgroundColor: "hsl(24 33% 97%)" }}>
                                            <p className="text-xs text-gray-400">カスタマイズ</p>
                                        </div>
                                    </>}
                                    <li key={"smart-voice-custom_" + i}>
                                        <label className="label inline-flex active:!bg-inherit">
                                            <input disabled={isLoading} type="radio" name="voice-option" className="radio radio-accent" onChange={change} value={model} checked={model === selectedModel} />
                                            <a className="grow">{mapModel(model)}</a>
                                        </label>
                                    </li>
                                </>
                            ))
                        }
                    </>}
                </ul>
                {selectedModel !== "off" && !isLoading &&
                    <div className="bg-base-200 rounded-lg h-28 flex flex-col justify-center">
                        <label className="cursor-pointer label flex-col items-start">
                            <span className="label-text">話速：{lengthScale === 1 ? "1（デフォルト）" : lengthScale}</span>
                            <input type="range" min={0.1} max={2.0} step={0.1} value={lengthScale} className="range range-warning range-xs" onChange={e => setLengthScale(parseFloat(e.target.value))} />
                        </label>
                        <label className="cursor-pointer label flex-col items-start">
                            <span className="label-text">抑揚：{sdpRatio === 0.2 ? "0.2（デフォルト）" : sdpRatio}</span>
                            <input type="range" min={0} max={1.0} step={0.1} value={sdpRatio} className="range range-warning range-xs" onChange={e => setSdpRatio(parseFloat(e.target.value))} />
                        </label>
                    </div>
                }
                {isLoading &&
                    <div className="bg-base-200 rounded-lg h-28 flex flex-col justify-center">
                        <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-10">
                                <path d="M10 3.75a2 2 0 1 0-4 0 2 2 0 0 0 4 0ZM17.25 4.5a.75.75 0 0 0 0-1.5h-5.5a.75.75 0 0 0 0 1.5h5.5ZM5 3.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75ZM4.25 17a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5h1.5ZM17.25 17a.75.75 0 0 0 0-1.5h-5.5a.75.75 0 0 0 0 1.5h5.5ZM9 10a.75.75 0 0 1-.75.75h-5.5a.75.75 0 0 1 0-1.5h5.5A.75.75 0 0 1 9 10ZM17.25 10.75a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5h1.5ZM14 10a2 2 0 1 0-4 0 2 2 0 0 0 4 0ZM10 16.25a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z" />
                            </svg>
                        </div>
                    </div>}
            </ul>
        </div >
    )
}

export { SmartVoice }
