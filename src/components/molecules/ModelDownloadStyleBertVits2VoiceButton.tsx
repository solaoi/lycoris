import { invoke } from '@tauri-apps/api/core'
import { useRecoilState, useRecoilValue } from 'recoil'
import { modelStyleBertVits2VoiceDownloadingState } from '../../store/atoms/modelStyleBertVits2VoiceDownloadingState'
import { modelStyleBertVits2VoiceDownloadedState } from '../../store/atoms/modelStyleBertVits2VoiceDownloadedState'
import { modelStyleBertVits2DownloadedState } from '../../store/atoms/modelStyleBertVits2DownloadedState'

type Props = {
    modelType: string
}

const ModelDownloadStyleBertVits2VoiceButton = (props: Props): JSX.Element => {
    const { modelType } = props
    const downloadedModels = useRecoilValue(modelStyleBertVits2VoiceDownloadedState);
    const downloadedBaseModels = useRecoilValue(modelStyleBertVits2DownloadedState);
    const [downloadingModels, setDownloadingModels] = useRecoilState(modelStyleBertVits2VoiceDownloadingState)
    const click = () => {
        setDownloadingModels([...downloadingModels, modelType])
        invoke('download_sbv2_model_command', { model: modelType })
    }
    const is_downloaded = downloadedModels.filter(m => m === modelType).length > 0
    const is_downloading = downloadingModels.filter(m => m === modelType).length > 0
    const is_base_downloaded = downloadedBaseModels.filter(m => m === "style-bert-vits2").length > 0

    return (
        <button className="btn bg-base-100 border border-solid border-neutral-300 gap-2 text-secondary" onClick={click} disabled={is_downloaded || is_downloading || !is_base_downloaded}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {is_base_downloaded ? "ダウンロード" + (is_downloaded ? "済" : "") : "要：基本エンジン"}
        </button>
    )
}

export { ModelDownloadStyleBertVits2VoiceButton }