import { ChangeEvent } from "react";
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

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const transcriptionAccuracy = e.target.value
        setTranscriptionAccuracy(transcriptionAccuracy)
    }

    const mapModel = (model: string) => {
        switch (model) {
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
        <select className="select select-bordered w-full max-w-xs focus:outline-none text-xs disabled:bg-base-300" name="transcription-accuracy" disabled={isRecording} onChange={change}>
            <option disabled>追っかけ設定</option>
            <option value="off" selected={transcriptionAccuracy === "off"}>オフ</option>
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
                <option key={"transcription-accuracy" + i} value={model} selected={model === transcriptionAccuracy}>{mapModel(model)}</option>
            ))}
            {settingKeyOpenai && <>
                <option value="online-transcript" selected={"online-transcript" === transcriptionAccuracy}>文字起こし：オンライン</option>
                <option value="online-chat" selected={"online-chat" === transcriptionAccuracy}>AI：オンライン</option>
                {(!speakerLanguage?.startsWith("en-us") && !speakerLanguage?.startsWith("small-en-us")) && (<option value="online-translate-to-en" selected={"online-translate-to-en" === transcriptionAccuracy}>翻訳（英）：オンライン</option>)}</>}
        </select>
    )
}

export { TranscriptionAccuracy }
