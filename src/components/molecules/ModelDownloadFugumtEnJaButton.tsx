import { invoke } from '@tauri-apps/api/tauri'
import { useRecoilState, useRecoilValue } from 'recoil'
import { modelFugumtEnJaDownloadingState } from '../../store/atoms/modelFugumtEnJaDownloadingState'
import { modelFugumtEnJaDownloadedState } from '../../store/atoms/modelFugumtEnJaDownloadedState'
import { modelWhisperDownloadedState } from '../../store/atoms/modelWhisperDownloadedState'

const ModelDownloadFugumtEnJaButton = (): JSX.Element => {
    const modelType = "fugumt-en-ja"
    const downloadedModels = useRecoilValue(modelFugumtEnJaDownloadedState)
    const downloadedBaseModels = useRecoilValue(modelWhisperDownloadedState)
    const [downloadingModels, setDownloadingModels] = useRecoilState(modelFugumtEnJaDownloadingState)
    const click = () => {
        setDownloadingModels([...downloadingModels, modelType])
        invoke('download_fugumt_enja_model_command')
    }
    const is_downloaded = downloadedModels.filter(m => m === modelType).length > 0
    const is_downloading = downloadingModels.filter(m => m === modelType).length > 0
    const is_base_downloaded = downloadedBaseModels.filter(m => m === "large").length > 0

    return (
        <button className="btn gap-2 bg-base-100 border border-solid border-neutral-300 text-secondary select-none" onClick={click} disabled={is_downloaded || is_downloading || !is_base_downloaded}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {is_base_downloaded ? "ダウンロード" + (is_downloaded ? "済" : "") : "要：汎用パック"}
        </button>
    )
}

export { ModelDownloadFugumtEnJaButton }