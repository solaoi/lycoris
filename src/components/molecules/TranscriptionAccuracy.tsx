import { ChangeEvent } from "react";
import { useRecoilState, useRecoilValue } from 'recoil';
import { transcriptionAccuracyState } from "../../store/atoms/transcriptionAccuracyState";
import { modelWhisperDownloadedState } from "../../store/atoms/modelWhisperDownloadedState";

const TranscriptionAccuracy = (): JSX.Element => {
    const downloadedModels = useRecoilValue(modelWhisperDownloadedState)
    const [transcriptionAccuracy, setTranscriptionAccuracy] = useRecoilState(transcriptionAccuracyState)

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const transcriptionAccuracy = e.target.value
        setTranscriptionAccuracy(transcriptionAccuracy)
    }

    const mapModel = (model: string) => {
        switch (model) {
            case "small":
                return "追っかけ：小";
            case "medium":
                return "追っかけ：中";
            case "large":
                return "追っかけ：高";
            default:
                throw new Error("unknown modelType");
        }
    }

    return (
        <select className="select select-bordered w-full max-w-xs focus:outline-none text-xs" name="transcription-accuracy" onChange={change} defaultValue={transcriptionAccuracy ?? "off"}>
            <option disabled value="accuracy-selector">追っかけ高精度</option>
            <option value="off">追っかけ：オフ</option>
            {downloadedModels?.map((model, i) => (
                <option key={"transcription-accuracy" + i} value={model} selected={model === transcriptionAccuracy}>{mapModel(model)}</option>
            ))}
        </select>
    )
}

export { TranscriptionAccuracy }
