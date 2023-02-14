import { invoke } from '@tauri-apps/api/tauri'
import { useRecoilState } from 'recoil'
import { downloadWhisperModelState } from '../../store/atoms/downloadWhisperModelState'

type Props = {
    modelType: string
}

const ModelDownloadWhisperButton = (props: Props): JSX.Element => {
    const { modelType } = props
    const [downloadingModels, setDownloadingModels] = useRecoilState(downloadWhisperModelState)
    const click = () => {
        setDownloadingModels([...downloadingModels, modelType])
        invoke('download_whisper_model_command', { model: modelType })
    }

    return (
        <button className="btn gap-2 glass text-secondary" onClick={click} disabled={downloadingModels.filter(m => m === modelType).length > 0}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ダウンロード
        </button>
    )
}

export { ModelDownloadWhisperButton }