import { invoke } from '@tauri-apps/api/core'
import { useRecoilState, useRecoilValue } from 'recoil'
import { modelFugumtJaEnDownloadingState } from '../../store/atoms/modelFugumtJaEnDownloadingState'
import { modelFugumtJaEnDownloadedState } from '../../store/atoms/modelFugumtJaEnDownloadedState'
import { modelWhisperDownloadedState } from '../../store/atoms/modelWhisperDownloadedState'

const ModelDownloadFugumtJaEnButton = (): JSX.Element => {
    const modelType = "fugumt-ja-en"
    const downloadedModels = useRecoilValue(modelFugumtJaEnDownloadedState)
    const downloadedBaseModels = useRecoilValue(modelWhisperDownloadedState)
    const [downloadingModels, setDownloadingModels] = useRecoilState(modelFugumtJaEnDownloadingState)
    const click = () => {
        setDownloadingModels([...downloadingModels, modelType])
        invoke('download_fugumt_jaen_model_command')
    }
    const is_downloaded = downloadedModels.filter(m => m === modelType).length > 0
    const is_downloading = downloadingModels.filter(m => m === modelType).length > 0
    const is_base_downloaded = downloadedBaseModels.filter(m => m === "large").length > 0

    return (
        <button className="btn gap-2 bg-base-100 border border-solid border-neutral-300 text-secondary" onClick={click} disabled={is_downloaded || is_downloading || !is_base_downloaded}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {is_base_downloaded ? "ダウンロード" + (is_downloaded ? "済" : "") : "要：汎用パック"}
        </button>
    )
}

export { ModelDownloadFugumtJaEnButton }