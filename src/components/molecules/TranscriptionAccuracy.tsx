import { ChangeEvent } from "react";
import { useRecoilState, useRecoilValue } from 'recoil';
import { transcriptionAccuracyState } from "../../store/atoms/transcriptionAccuracyState";
import { modelWhisperDownloadedState } from "../../store/atoms/modelWhisperDownloadedState";
import { recordState } from "../../store/atoms/recordState";

const TranscriptionAccuracy = (): JSX.Element => {
    const downloadedModels = useRecoilValue(modelWhisperDownloadedState)
    const [transcriptionAccuracy, setTranscriptionAccuracy] = useRecoilState(transcriptionAccuracyState)
    const isRecording = useRecoilValue(recordState)

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const transcriptionAccuracy = e.target.value
        setTranscriptionAccuracy(transcriptionAccuracy)
    }

    const mapModel = (model: string) => {
        switch (model) {
            case "small":
                return "文字起こし：小";
            case "medium":
                return "文字起こし：中";
            case "large":
                return "文字起こし：高";
            default:
                throw new Error("unknown modelType");
        }
    }

    return (
        <select className="select select-bordered w-full max-w-xs focus:outline-none text-xs disabled:bg-base-300" name="transcription-accuracy" disabled={isRecording} onChange={change} defaultValue={transcriptionAccuracy ?? "off"}>
            <option disabled value="accuracy-selector">追っかけ設定</option>
            <option value="off">オフ</option>
            {downloadedModels?.map((model, i) => (
                <option key={"transcription-accuracy" + i} value={model} selected={model === transcriptionAccuracy}>{mapModel(model)}</option>
            ))}
        </select>
    )
}

export { TranscriptionAccuracy }
