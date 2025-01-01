import { invoke } from '@tauri-apps/api/tauri'
import { useRecoilState, useRecoilValue } from 'recoil'
import { modelWhisperDownloadingState } from '../../store/atoms/modelWhisperDownloadingState'
import { modelWhisperDownloadedState } from '../../store/atoms/modelWhisperDownloadedState'

type Props = {
    modelType: string
}

const ModelDownloadWhisperButton = (props: Props): JSX.Element => {
    const { modelType } = props
    const downloadedModels = useRecoilValue(modelWhisperDownloadedState);
    const [downloadingModels, setDownloadingModels] = useRecoilState(modelWhisperDownloadingState)
    const click = () => {
        setDownloadingModels([...downloadingModels, modelType])
        invoke('download_whisper_model_command', { model: modelType })
    }
    const is_downloaded = downloadedModels.filter(m => m === modelType).length > 0
    const is_downloading = downloadingModels.filter(m => m === modelType).length > 0

    return (
        <button className="btn bg-base-100 border border-solid border-neutral-300 gap-2 text-secondary select-none" onClick={click} disabled={is_downloaded || is_downloading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ダウンロード{is_downloaded && "済"}
        </button>
    )
}

export { ModelDownloadWhisperButton }