import { ChangeEvent, useRef } from "react";
import { useRecoilState, useRecoilValue } from 'recoil';
import { transcriptionAccuracyState } from "../../store/atoms/transcriptionAccuracyState";
import { modelWhisperDownloadedState } from "../../store/atoms/modelWhisperDownloadedState";
import { recordState } from "../../store/atoms/recordState";
import { speakerLanguageState } from "../../store/atoms/speakerLanguageState";
import { settingKeyState } from "../../store/atoms/settingKeyState";

const TranscriptionAccuracy = (): JSX.Element => {
    const downloadedModels = useRecoilValue(modelWhisperDownloadedState)
    const [transcriptionAccuracy, setTranscriptionAccuracy] = useRecoilState(transcriptionAccuracyState)
    const isRecording = useRecoilValue(recordState)
    const speakerLanguage = useRecoilValue(speakerLanguageState)
    const settingKeyOpenai = useRecoilValue(settingKeyState("settingKeyOpenai"))

    const dropdownRef = useRef<HTMLLabelElement>(null)

    const change = (e: ChangeEvent<HTMLInputElement>) => {
        dropdownRef.current?.focus();
        if (e.target.checked) {
            const transcriptionAccuracy = e.target.value
            setTranscriptionAccuracy(transcriptionAccuracy)
        }
    }

    const checkAndCloseDropDown = (target: EventTarget & HTMLLabelElement) => {
        if (target && target.matches(':focus')) {
            setTimeout(() => target.blur(), 0);
        }
    }

    const mapModel = (model: string) => {
        switch (model) {
            case "off":
                return "オフ";
            case "small":
                return "文字起こし：低";
            case "medium":
                return "文字起こし：中";
            case "large":
                return "文字起こし：高";
            case "large-distil.en":
                return "文字起こし：英";
            case "small-translate-to-en":
                return "翻訳（英）：低";
            case "medium-translate-to-en":
                return "翻訳（英）：中";
            case "large-translate-to-en":
                return "翻訳（英）：高";
            default:
                throw new Error("unknown modelType: " + model);
        }
    }

    return (
        <div className="dropdown">
            {(isRecording || downloadedModels.length === 0) ? <label tabIndex={0} className="group normal-case btn w-52 flex justify-between btn-disabled" style={{ color: "inherit", backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}>
                <div className="w-36 text-left overflow-x-hidden whitespace-nowrap text-ellipsis">{transcriptionAccuracy === null ? "追っかけ方法を選択" : mapModel(transcriptionAccuracy)}</div>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="opacity-0 w-24 invisible rounded text-[12px] 
                        font-bold text-white py-1 bg-slate-600 top-12 left-4
                        group-hover:visible opacity-100 absolute ">追っかけ方法
                </div>
            </label> : <label ref={dropdownRef} onMouseDown={e => checkAndCloseDropDown(e.currentTarget)} tabIndex={0} className="group normal-case btn w-52 flex justify-between" style={{ color: "inherit", backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}
            >
                <div className="w-36 text-left overflow-x-hidden whitespace-nowrap text-ellipsis">{transcriptionAccuracy === null ? "話し手の言語を選択" : mapModel(transcriptionAccuracy)}</div>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="opacity-0 w-24 invisible rounded text-[12px] 
                        font-bold text-white py-1 bg-slate-600 top-12 left-4
                        group-hover:visible opacity-100 absolute ">追っかけ方法
                </div>
            </label>}
            <ul tabIndex={0} className="dropdown-content menu rounded-box w-52"
                style={{ backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}
            >
                <li key="transcription-accuracy_off">
                    <label className="label inline-flex active:bg-inherit">
                        <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="off" checked={transcriptionAccuracy === "off"} />
                        <a className="grow">オフ</a>
                    </label>
                </li>
                {downloadedModels.length > 0 && <ul className="max-h-56 overflow-y-scroll">
                    {downloadedModels?.reduce((a: string[], c) => {
                        if (speakerLanguage?.startsWith("en-us") || speakerLanguage?.startsWith("small-en-us")) {
                            return [...a, c]
                        }
                        if (c === "large-distil.en") {
                            if (speakerLanguage?.startsWith("en-us") || speakerLanguage?.startsWith("small-en-us")) {
                                return [...a, c]
                            } else {
                                return a
                            }
                        }
                        return [...a, c, `${c}-translate-to-en`]
                    }, []).map((model, i) => (
                        <li key={"transcription-accuracy_" + i}>
                            <label className="label inline-flex active:bg-inherit">
                                <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value={model} checked={model === transcriptionAccuracy} />
                                <a className="grow">{mapModel(model)}</a>
                            </label>
                        </li>
                    ))}
                </ul>}
                {settingKeyOpenai && <>
                    <li key="transcription-accuracy_online-transcript">
                        <label className="label inline-flex active:bg-inherit">
                            <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="online-transcript" checked={"online-transcript" === transcriptionAccuracy} />
                            <a className="grow">文字起こし：オンライン</a>
                        </label>
                    </li>
                    <li key="transcription-accuracy_online-chat">
                        <label className="label inline-flex active:bg-inherit">
                            <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="online-chat" checked={"online-chat" === transcriptionAccuracy} />
                            <a className="grow">AI：オンライン</a>
                        </label>
                    </li>
                    {(!speakerLanguage?.startsWith("en-us") && !speakerLanguage?.startsWith("small-en-us")) && (
                        <li key="online-translate-to-en">
                            <label className="label inline-flex active:bg-inherit">
                                <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="online-chat" checked={"online-translate-to-en" === transcriptionAccuracy} />
                                <a className="grow">翻訳（英）：オンライン</a>
                            </label>
                        </li>
                    )}</>}
            </ul>
        </div>
    )
}

export { TranscriptionAccuracy }
