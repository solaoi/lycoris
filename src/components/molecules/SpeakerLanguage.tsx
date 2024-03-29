import { ChangeEvent, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from 'recoil';
import { speakerLanguageState } from "../../store/atoms/speakerLanguageState";
import { modelVoskDownloadedState } from "../../store/atoms/modelVoskDownloadedState";
import { recordState } from "../../store/atoms/recordState";

const SpeakerLanguage = (): JSX.Element => {
    const downloadedModels = useRecoilValue(modelVoskDownloadedState)
    const [speakerLanguage, setSpeakerLanguage] = useRecoilState(speakerLanguageState)
    const isRecording = useRecoilValue(recordState)
    const dropdownRef = useRef<HTMLLabelElement>(null)

    const change = (e: ChangeEvent<HTMLInputElement>) => {
        dropdownRef.current?.focus();
        if (e.target.checked) {
            const speakerLanguage = e.target.value
            setSpeakerLanguage(speakerLanguage)
        }
    }

    const checkAndCloseDropDown = (target: EventTarget & HTMLLabelElement) => {
        if (target && target.matches(':focus')) {
            setTimeout(() => target.blur(), 0);
        }
    }

    const mapModel = (model: string) => {
        switch (model) {
            case "small-ja-0.22":
                return "日本語：低";
            case "ja-0.22":
                return "日本語";
            case "small-en-us-0.15":
                return "英語：低";
            case "en-us-0.22":
                return "英語";
            case "small-cn-0.22":
                return "中国語：低";
            case "cn-0.22":
                return "中国語";
            case "small-ko-0.22":
                return "韓国語：低";
            case "small-fr-0.22":
                return "フランス語：低";
            case "fr-0.22":
                return "フランス語";
            case "small-de-0.15":
                return "ドイツ語：低";
            case "de-0.21":
                return "ドイツ語";
            case "small-ru-0.22":
                return "ロシア語：低";
            case "ru-0.42":
                return "ロシア語";
            case "small-es-0.42":
                return "スペイン語：低";
            case "es-0.42":
                return "スペイン語";
            case "small-pt-0.3":
                return "ポルトガル語：低";
            case "small-tr-0.3":
                return "トルコ語：低";
            case "small-vn-0.4":
                return "ベトナム語：低";
            case "vn-0.4":
                return "ベトナム語";
            case "small-it-0.22":
                return "イタリア語：低";
            case "it-0.22":
                return "イタリア語";
            case "small-nl-0.22":
                return "オランダ語：低";
            case "small-ca-0.4":
                return "カタルーニャ語：低";
            case "small-uk-v3-small":
                return "ウクライナ語：低";
            case "uk-v3":
                return "ウクライナ語";
            case "small-sv-rhasspy-0.15":
                return "スウェーデン語：低";
            case "small-hi-0.22":
                return "ヒンディー語：低";
            case "hi-0.22":
                return "ヒンディー語";
            case "small-cs-0.4-rhasspy":
                return "チェコ語：低";
            case "small-pl-0.22":
                return "ポーランド語：低";
            default:
                throw new Error("unknown modelType");
        }
    }

    return (
        <div className="dropdown">
            {(isRecording || downloadedModels.length === 0) ? <label tabIndex={0} className="group normal-case btn w-52 flex justify-between btn-disabled" style={{ color: "inherit", backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}>
                <div className="w-36 text-left overflow-x-hidden whitespace-nowrap text-ellipsis">{speakerLanguage === null ? "話し手の言語を選択" : mapModel(speakerLanguage)}</div>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="opacity-0 w-24 invisible rounded text-[12px] 
                        font-bold text-white py-1 bg-slate-600 top-12 left-4
                        group-hover:visible opacity-100 absolute ">話し手の言語
                </div>
            </label> : <label ref={dropdownRef} onMouseDown={e => checkAndCloseDropDown(e.currentTarget)} tabIndex={0} className="group normal-case btn w-52 flex justify-between" style={{ color: "inherit", backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}
            >
                <div className="w-36 text-left overflow-x-hidden whitespace-nowrap text-ellipsis">{speakerLanguage === null ? "話し手の言語を選択" : mapModel(speakerLanguage)}</div>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="opacity-0 w-24 invisible rounded text-[12px] 
                        font-bold text-white py-1 bg-slate-600 top-12 left-4
                        group-hover:visible opacity-100 absolute ">話し手の言語
                </div>
            </label>}
            <ul tabIndex={0} className="dropdown-content menu rounded-box w-52"
                style={{ backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}
            >
                {downloadedModels.length > 0 && <ul className="max-h-56 overflow-y-scroll rounded-box">
                    {downloadedModels.map((model, i) => (
                        <li key={"speaker-language_" + i}>
                            <label className="label inline-flex active:bg-inherit">
                                <input type="radio" name="language-option" className="radio radio-accent" onChange={change} value={model} checked={model === speakerLanguage} />
                                <a className="grow">{mapModel(model)}</a>
                            </label>
                        </li>
                    ))}
                </ul>}
            </ul>
        </div>
    )
}

export { SpeakerLanguage }
