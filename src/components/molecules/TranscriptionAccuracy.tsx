import { ChangeEvent, useRef } from "react";
import { useRecoilState, useRecoilValue } from 'recoil';
import { transcriptionAccuracyState } from "../../store/atoms/transcriptionAccuracyState";
import { modelWhisperDownloadedState } from "../../store/atoms/modelWhisperDownloadedState";
import { recordState } from "../../store/atoms/recordState";
import { speakerLanguageState } from "../../store/atoms/speakerLanguageState";
import { settingKeyState } from "../../store/atoms/settingKeyState";
import { tracingState } from "../../store/atoms/tracingState";
import { modelFugumtEnJaDownloadedState } from "../../store/atoms/modelFugumtEnJaDownloadedState";
import { modelFugumtJaEnDownloadedState } from "../../store/atoms/modelFugumtJaEnDownloadedState";
import { modelHonyaku13BDownloadedState } from "../../store/atoms/modelHonyaku13BDownloadedState";

const TranscriptionAccuracy = (): JSX.Element => {
    const downloadedModels = useRecoilValue(modelWhisperDownloadedState)
    const downloadedModelsFugumtEnJa = useRecoilValue(modelFugumtEnJaDownloadedState)
    const downloadedModelsFugumtJaEn = useRecoilValue(modelFugumtJaEnDownloadedState)
    const downloadedModelsHonyaku13B = useRecoilValue(modelHonyaku13BDownloadedState)
    const [transcriptionAccuracy, setTranscriptionAccuracy] = useRecoilState(transcriptionAccuracyState)
    const isRecording = useRecoilValue(recordState)
    const isTracing = useRecoilValue(tracingState);
    const speakerLanguage = useRecoilValue(speakerLanguageState)
    const settingKeyOpenai = useRecoilValue(settingKeyState("settingKeyOpenai"))
    const settingKeyAmivoice = useRecoilValue(settingKeyState("settingKeyAmivoice"))

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
                return "汎用パック（低精度）";
            case "medium":
                return "汎用パック（中精度）";
            case "large":
                return "汎用パック（高精度）";
            case "large-turbo":
                return "汎用パック（速度優先）";
            case "large-distil.en":
                return "英語パック";
            case "large-distil.ja":
                return "日本語パック";
            case "large-distil.bilingual":
                return "バイリンガルパック";
            case "online-transcript":
                return "Whisper";
            case "online-transcript-to-en":
                return "Whisper";
            case "online-amivoice":
                return "AmiVoice";
            case "online-chat":
                return "ChatGPT";
            case "small-translate-to-en":
                return "汎用パック（低精度）";
            case "medium-translate-to-en":
                return "汎用パック（中精度）";
            case "large-translate-to-en":
                return "汎用パック（高精度）";
            case "large-turbo-translate-to-en":
                return "汎用パック（速度優先）";
            case "fugumt-en-ja":
                return "日本語パック（標準）";
            case "fugumt-ja-en":
                return "英語パック（標準）";
            case "honyaku-13b":
                return "日本語パック（精度優先）";
            default:
                throw new Error("unknown modelType: " + model);
        }
    }
    const transcriptionModels = ["small", "medium", "large", "large-turbo"];
    const targetedTranscriptionModels = ["large-distil.en", "large-distil.ja"];

    return (
        <div className="dropdown">
            {((isRecording || isTracing) ||
                // 追っかけが無効となるケースを列挙
                // 1. ローカルにWhisperモデルがダウンロードされていない場合
                (downloadedModels.length === 0 &&
                    // 2. WhisperのAPIキーが設定されていない場合
                    settingKeyOpenai === "" &&
                    // 3. ローカルにWhisperLargeモデルがダウンロードされていない場合 or ローカルにFugumtEnJaモデルがダウンロードされていない場合 or ダウンロードされていても、話し手の言語が日本語の場合
                    !(downloadedModels.includes("large") && downloadedModelsFugumtEnJa.length !== 0 && !(speakerLanguage?.startsWith("ja") || speakerLanguage?.startsWith("small-ja"))) &&
                    // 4. ローカルにWhisperLargeモデルがダウンロードされていない場合 or ローカルにFugumtJaEnモデルがダウンロードされていない場合 or ダウンロードされていても、話し手の言語が日本語以外の場合
                    !(downloadedModels.includes("large") && downloadedModelsFugumtJaEn.length !== 0 && (speakerLanguage?.startsWith("ja") || speakerLanguage?.startsWith("small-ja"))) &&
                    // 5. ローカルにWhisperLargeモデルがダウンロードされていない場合 or ローカルにHonyaku13Bモデルがダウンロードされていない場合 or ダウンロードされていても、話し手の言語が日本語の場合
                    !(downloadedModels.includes("large") && downloadedModelsHonyaku13B.length !== 0 && !(speakerLanguage?.startsWith("ja") || speakerLanguage?.startsWith("small-ja"))) &&
                    // 6. AmiVoiceのAPIキーが設定されていない場合 or 設定されていても、話し手の言語が日本語以外の場合
                    !(settingKeyAmivoice !== "" && (speakerLanguage?.startsWith("ja") || speakerLanguage?.startsWith("small-ja"))))) ? <label tabIndex={0} className="group normal-case btn w-52 flex justify-between btn-disabled" style={{ color: "inherit", backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}>
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
                <div className="w-36 text-left overflow-x-hidden whitespace-nowrap text-ellipsis">{transcriptionAccuracy === null ? "追っかけ方法" : mapModel(transcriptionAccuracy)}</div>
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
            <ul tabIndex={0} className="dropdown-content menu rounded-box w-60"
                style={{ backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}
            >
                <ul className="max-h-56 overflow-y-scroll rounded-box scrollbar-transparent">
                    <li key="transcription-accuracy_off">
                        <label className="label inline-flex active:!bg-inherit">
                            <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="off" checked={transcriptionAccuracy === "off"} />
                            <a className="grow">オフ</a>
                        </label>
                    </li>
                    {downloadedModels.length > 0 && <>
                        <hr className="my-2" />
                        <div className="flex justify-center sticky top-0 z-10 w-full" style={{ backgroundColor: "hsl(24 33% 97%)" }}>
                            <p className="text-xs text-gray-400">オフライン</p>
                        </div>
                        {downloadedModels
                            .filter(m => transcriptionModels.includes(m))
                            .map((model, i) => (
                                <>
                                    {i === 0 ?
                                        <p className="text-sm ml-2 my-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 mr-1">
                                                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                                <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                                            </svg>
                                            文字起こし（汎用）
                                        </p> : ""}
                                    <li key={"transcription-accuracy_" + i}>
                                        <label className="label inline-flex active:!bg-inherit">
                                            <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value={model} checked={model === transcriptionAccuracy} />
                                            <a className="grow">{mapModel(model)}</a>
                                        </label>
                                    </li>
                                </>
                            ))
                        }
                        {downloadedModels
                            .filter(m => targetedTranscriptionModels.includes(m))
                            .reduce((a: string[], c) => {
                                if (c === "large-distil.en") {
                                    if (speakerLanguage?.startsWith("en-us") || speakerLanguage?.startsWith("small-en-us")) {
                                        return [...a, c]
                                    } else {
                                        return a
                                    }
                                }
                                if (c === "large-distil.ja") {
                                    if (speakerLanguage?.startsWith("ja") || speakerLanguage?.startsWith("small-ja")) {
                                        return [...a, c]
                                    } else {
                                        return a
                                    }
                                }
                                return [...a, c]
                            }, [])
                            .map((model, i) => (
                                <>
                                    {i === 0 ?
                                        <p className="text-sm ml-2 my-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 mr-1">
                                                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                                <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                                            </svg>
                                            文字起こし（言語特化）
                                        </p> : ""}
                                    <li key={"transcription-accuracy_" + i}>
                                        <label className="label inline-flex active:!bg-inherit">
                                            <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value={model} checked={model === transcriptionAccuracy} />
                                            <a className="grow">{mapModel(model)}</a>
                                        </label>
                                    </li>
                                </>
                            ))
                        }
                        {(speakerLanguage?.startsWith("en-us") || speakerLanguage?.startsWith("small-en-us")) && downloadedModels
                            .filter(m => m === "large-distil.bilingual")
                            .map((model, i) => (
                                <>
                                    {i === 0 ?
                                        <p className="text-sm ml-2 my-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 mr-1">
                                                <path d="M1 8.849c0 1 .738 1.851 1.734 1.947L3 10.82v2.429a.75.75 0 0 0 1.28.53l1.82-1.82A3.484 3.484 0 0 1 5.5 10V9A3.5 3.5 0 0 1 9 5.5h4V4.151c0-1-.739-1.851-1.734-1.947a44.539 44.539 0 0 0-8.532 0C1.738 2.3 1 3.151 1 4.151V8.85Z" />
                                                <path d="M7 9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.25v1.25a.75.75 0 0 1-1.28.53L9.69 12H9a2 2 0 0 1-2-2V9Z" />
                                            </svg>
                                            翻訳（英語⇒日本語）
                                        </p> : ""}
                                    <li key={"transcription-accuracy_" + i}>
                                        <label className="label inline-flex active:!bg-inherit">
                                            <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value={model} checked={model === transcriptionAccuracy} />
                                            <a className="grow">{mapModel(model)}</a>
                                        </label>
                                    </li>
                                </>
                            ))
                        }
                        {(speakerLanguage?.startsWith("ja") || speakerLanguage?.startsWith("small-ja")) && downloadedModels
                            .filter(m => m === "large-distil.bilingual")
                            .map((model, i) => (
                                <>
                                    {i === 0 ?
                                        <p className="text-sm ml-2 my-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 mr-1">
                                                <path d="M1 8.849c0 1 .738 1.851 1.734 1.947L3 10.82v2.429a.75.75 0 0 0 1.28.53l1.82-1.82A3.484 3.484 0 0 1 5.5 10V9A3.5 3.5 0 0 1 9 5.5h4V4.151c0-1-.739-1.851-1.734-1.947a44.539 44.539 0 0 0-8.532 0C1.738 2.3 1 3.151 1 4.151V8.85Z" />
                                                <path d="M7 9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.25v1.25a.75.75 0 0 1-1.28.53L9.69 12H9a2 2 0 0 1-2-2V9Z" />
                                            </svg>
                                            翻訳（日本語⇒英語）
                                        </p> : ""}
                                    <li key={"transcription-accuracy_" + i}>
                                        <label className="label inline-flex active:!bg-inherit">
                                            <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value={model} checked={model === transcriptionAccuracy} />
                                            <a className="grow">{mapModel(model)}</a>
                                        </label>
                                    </li>
                                </>
                            ))
                        }
                        {!(speakerLanguage?.startsWith("en-us") || speakerLanguage?.startsWith("small-en-us")) && downloadedModels
                            .filter(m => transcriptionModels.includes(m))
                            .map(m => `${m}-translate-to-en`)
                            .map((model, i) => (
                                <>
                                    {i === 0 ?
                                        <p className="text-sm ml-2 my-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 mr-1">
                                                <path d="M1 8.849c0 1 .738 1.851 1.734 1.947L3 10.82v2.429a.75.75 0 0 0 1.28.53l1.82-1.82A3.484 3.484 0 0 1 5.5 10V9A3.5 3.5 0 0 1 9 5.5h4V4.151c0-1-.739-1.851-1.734-1.947a44.539 44.539 0 0 0-8.532 0C1.738 2.3 1 3.151 1 4.151V8.85Z" />
                                                <path d="M7 9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.25v1.25a.75.75 0 0 1-1.28.53L9.69 12H9a2 2 0 0 1-2-2V9Z" />
                                            </svg>
                                            翻訳（18言語⇒英語）
                                        </p> : ""}
                                    <li key={"transcription-accuracy_" + i}>
                                        <label className="label inline-flex active:!bg-inherit">
                                            <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value={model} checked={model === transcriptionAccuracy} />
                                            <a className="grow">{mapModel(model)}</a>
                                        </label>
                                    </li>
                                </>
                            ))
                        }
                        {downloadedModels.includes("large")
                            && !(speakerLanguage?.startsWith("ja") || speakerLanguage?.startsWith("small-ja"))
                            && (downloadedModelsFugumtEnJa.length > 0 || downloadedModelsHonyaku13B.length > 0) && <>
                                <p className="text-sm ml-2 my-2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 mr-1">
                                        <path d="M1 8.849c0 1 .738 1.851 1.734 1.947L3 10.82v2.429a.75.75 0 0 0 1.28.53l1.82-1.82A3.484 3.484 0 0 1 5.5 10V9A3.5 3.5 0 0 1 9 5.5h4V4.151c0-1-.739-1.851-1.734-1.947a44.539 44.539 0 0 0-8.532 0C1.738 2.3 1 3.151 1 4.151V8.85Z" />
                                        <path d="M7 9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.25v1.25a.75.75 0 0 1-1.28.53L9.69 12H9a2 2 0 0 1-2-2V9Z" />
                                    </svg>
                                    翻訳（18言語⇒日本語）
                                </p>
                                {downloadedModelsFugumtEnJa.length > 0 && <>
                                    <li key="transcription-accuracy_fugumt-en-ja">
                                        <label className="label inline-flex active:!bg-inherit">
                                            <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="fugumt-en-ja" checked={"fugumt-en-ja" === transcriptionAccuracy} />
                                            <a className="grow">日本語パック（標準）</a>
                                        </label>
                                    </li>
                                </>}
                                {downloadedModelsHonyaku13B.length > 0 && <>
                                    <li key="transcription-accuracy_honyaku-13b">
                                        <label className="label inline-flex active:!bg-inherit">
                                            <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="honyaku-13b" checked={"honyaku-13b" === transcriptionAccuracy} />
                                            <a className="grow">日本語パック（精度優先）</a>
                                        </label>
                                    </li>
                                </>}
                            </>
                        }
                        {downloadedModels.includes("large")
                            && (speakerLanguage?.startsWith("ja") || speakerLanguage?.startsWith("small-ja"))
                            && (downloadedModelsFugumtJaEn.length > 0) && <>
                                <p className="text-sm ml-2 my-2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 mr-1">
                                        <path d="M1 8.849c0 1 .738 1.851 1.734 1.947L3 10.82v2.429a.75.75 0 0 0 1.28.53l1.82-1.82A3.484 3.484 0 0 1 5.5 10V9A3.5 3.5 0 0 1 9 5.5h4V4.151c0-1-.739-1.851-1.734-1.947a44.539 44.539 0 0 0-8.532 0C1.738 2.3 1 3.151 1 4.151V8.85Z" />
                                        <path d="M7 9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.25v1.25a.75.75 0 0 1-1.28.53L9.69 12H9a2 2 0 0 1-2-2V9Z" />
                                    </svg>
                                    翻訳（日本語⇒英語）
                                </p>
                                {downloadedModelsFugumtJaEn.length > 0 && <>
                                    <li key="transcription-accuracy_fugumt-en-ja">
                                        <label className="label inline-flex active:!bg-inherit">
                                            <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="fugumt-ja-en" checked={"fugumt-ja-en" === transcriptionAccuracy} />
                                            <a className="grow">英語パック（標準）</a>
                                        </label>
                                    </li>
                                </>}
                            </>
                        }
                    </>}
                    {(settingKeyOpenai || settingKeyAmivoice) && <>
                        <hr className="my-2" />
                        <div className="flex justify-center sticky top-0 z-10 w-full" style={{ backgroundColor: "hsl(24 33% 97%)" }}>
                            <p className="text-xs text-gray-400">オンライン</p>
                        </div>
                        <p className="text-sm ml-2 my-2 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 mr-1">
                                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                            </svg>
                            文字起こし
                        </p>
                        {settingKeyOpenai && <>
                            <li key="transcription-accuracy_online-transcript">
                                <label className="label inline-flex active:!bg-inherit">
                                    <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="online-transcript" checked={"online-transcript" === transcriptionAccuracy} />
                                    <a className="grow">Whisper</a>
                                </label>
                            </li>
                        </>}
                        {settingKeyAmivoice && (speakerLanguage?.startsWith("ja") || speakerLanguage?.startsWith("small-ja")) && <>
                            <li key="transcription-accuracy_online-amivoice">
                                <label className="label inline-flex active:!bg-inherit">
                                    <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="online-amivoice" checked={"online-amivoice" === transcriptionAccuracy} />
                                    <a className="grow">AmiVoice</a>
                                </label>
                            </li>
                        </>}
                        {settingKeyOpenai && <>
                            {(!speakerLanguage?.startsWith("en-us") && !speakerLanguage?.startsWith("small-en-us")) && (<>
                                <p className="text-sm ml-2 my-2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 mr-1">
                                        <path d="M1 8.849c0 1 .738 1.851 1.734 1.947L3 10.82v2.429a.75.75 0 0 0 1.28.53l1.82-1.82A3.484 3.484 0 0 1 5.5 10V9A3.5 3.5 0 0 1 9 5.5h4V4.151c0-1-.739-1.851-1.734-1.947a44.539 44.539 0 0 0-8.532 0C1.738 2.3 1 3.151 1 4.151V8.85Z" />
                                        <path d="M7 9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.25v1.25a.75.75 0 0 1-1.28.53L9.69 12H9a2 2 0 0 1-2-2V9Z" />
                                    </svg>
                                    翻訳（18言語⇒英語）
                                </p>
                                <li key="online-transcript-to-en">
                                    <label className="label inline-flex active:!bg-inherit">
                                        <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="online-transcript-to-en" checked={"online-transcript-to-en" === transcriptionAccuracy} />
                                        <a className="grow">Whisper</a>
                                    </label>
                                </li>
                            </>)}
                            <p className="text-sm ml-2 my-2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 mr-1">
                                    <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-5-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 9c-1.825 0-3.422.977-4.295 2.437A5.49 5.49 0 0 0 8 13.5a5.49 5.49 0 0 0 4.294-2.063A4.997 4.997 0 0 0 8 9Z" clipRule="evenodd" />
                                </svg>
                                アシスタント
                            </p>
                            <li key="transcription-accuracy_online-chat">
                                <label className="label inline-flex active:!bg-inherit">
                                    <input type="radio" name="trace-option" className="radio radio-accent" onChange={change} value="online-chat" checked={"online-chat" === transcriptionAccuracy} />
                                    <a className="grow">ChatGPT</a>
                                </label>
                            </li>
                        </>}
                    </>}
                </ul>
            </ul>
        </div>
    )
}

export { TranscriptionAccuracy }
