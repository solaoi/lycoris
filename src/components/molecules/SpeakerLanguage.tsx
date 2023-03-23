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
            default:
                throw new Error("unknown modelType");
        }
    }

    return (
        <select className="select select-bordered w-full max-w-xs focus:outline-none text-xs disabled:bg-base-300" name="speaker-languages" disabled={isRecording} onChange={change} defaultValue={speakerLanguage ?? "speaker-selector"}>
            <option disabled value="speaker-selector">話し手の言語</option>
            {downloadedModels?.map((model, i) => (
                <option key={"speaker-language" + i} value={model} selected={model === speakerLanguage}>{mapModel(model)}</option>
            ))}
        </select>
    )
}

export { SpeakerLanguage }
