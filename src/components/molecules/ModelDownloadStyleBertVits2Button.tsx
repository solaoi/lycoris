import { invoke } from '@tauri-apps/api/tauri'
import { useRecoilState, useRecoilValue } from 'recoil'
import { modelStyleBertVits2DownloadingState } from '../../store/atoms/modelStyleBertVits2DownloadingState'
import { modelStyleBertVits2DownloadedState } from '../../store/atoms/modelStyleBertVits2DownloadedState'

const ModelDownloadStyleBertVits2Button = (): JSX.Element => {
    const modelType = "style-bert-vits2"
    const downloadedModels = useRecoilValue(modelStyleBertVits2DownloadedState)
    const [downloadingModels, setDownloadingModels] = useRecoilState(modelStyleBertVits2DownloadingState)
    const click = () => {
        setDownloadingModels([...downloadingModels, modelType])
        invoke('download_sbv2_command')
    }
    const is_downloaded = downloadedModels.filter(m => m === modelType).length > 0
    const is_downloading = downloadingModels.filter(m => m === modelType).length > 0

    return (
        <button className="btn gap-2 bg-base-100 border border-solid border-neutral-300 text-secondary select-none" onClick={click} disabled={is_downloaded || is_downloading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ダウンロード{is_downloaded && "済"}
        </button>
    )
}

export { ModelDownloadStyleBertVits2Button }