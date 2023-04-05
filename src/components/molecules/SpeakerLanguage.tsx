import { ChangeEvent } from "react";
import { useRecoilState, useRecoilValue } from 'recoil';
import { speakerLanguageState } from "../../store/atoms/speakerLanguageState";
import { modelVoskDownloadedState } from "../../store/atoms/modelVoskDownloadedState";
import { recordState } from "../../store/atoms/recordState";

const SpeakerLanguage = (): JSX.Element => {
    const downloadedModels = useRecoilValue(modelVoskDownloadedState)
    const [speakerLanguage, setSpeakerLanguage] = useRecoilState(speakerLanguageState)
    const isRecording = useRecoilValue(recordState)

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const speakerLanguage = e.target.value
        setSpeakerLanguage(speakerLanguage)
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
        <select className="select select-bordered w-full max-w-xs focus:outline-none text-xs disabled:bg-base-300" name="speaker-languages" disabled={isRecording} onChange={change} >
            <option disabled selected={speakerLanguage === null}>話し手の言語</option>
            {downloadedModels?.map((model, i) => (
                <option key={"speaker-language" + i} value={model} selected={model === speakerLanguage}>{mapModel(model)}</option>
            ))}
        </select>
    )
}

export { SpeakerLanguage }
