import { invoke } from '@tauri-apps/api/core'
import { useRecoilState, useRecoilValue } from 'recoil'
import { modelReazonSpeechDownloadingState } from '../../store/atoms/modelReazonSpeechDownloadingState'
import { modelReazonSpeechDownloadedState } from '../../store/atoms/modelReazonSpeechDownloadedState'

const ModelDownloadReazonSpeechButton = (): JSX.Element => {
    const modelType = "reazonspeech"
    const downloadedModels = useRecoilValue(modelReazonSpeechDownloadedState)
    const [downloadingModels, setDownloadingModels] = useRecoilState(modelReazonSpeechDownloadingState)
    const click = () => {
        setDownloadingModels([...downloadingModels, modelType])
        invoke('download_reazonspeech_model_command')
    }
    const is_downloaded = downloadedModels.filter(m => m === modelType).length > 0
    const is_downloading = downloadingModels.filter(m => m === modelType).length > 0

    return (
        <button className="btn gap-2 bg-base-100 border border-solid border-neutral-300 text-secondary" onClick={click} disabled={is_downloaded || is_downloading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ダウンロード{is_downloaded && "済"}
        </button>
    )
}

export { ModelDownloadReazonSpeechButton }