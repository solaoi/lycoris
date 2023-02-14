import { useRecoilState } from 'recoil'
import { downloadWhisperModelState } from '../../store/atoms/downloadWhisperModelState'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useState } from 'react'
import { ProgressType } from '../../type/progress.type'

type Props = {
    modelType: string
}

const ModelDownloadWhisperProgress = (props: Props): JSX.Element => {
    const { modelType } = props
    const [downloadingModels, setDownloadingModels] = useRecoilState(downloadWhisperModelState)
    const [progress, setProgress] = useState<ProgressType>({
        model_type: modelType,
        rate: 0,
        is_progress: false
    })
    useEffect(() => {
        let unlistenDownloadProgress: any;

        async function f() {
            unlistenDownloadProgress = await listen('downloadWhisperProgress', event => {
                const p = event.payload as ProgressType
                if (p.model_type === modelType) {
                    setProgress(p)
                }
                if (!p.is_progress) {
                    setDownloadingModels(downloadingModels.filter(m => m !== modelType))
                }
            });
        }
        f();
        return () => {
            if (unlistenDownloadProgress) unlistenDownloadProgress();
        }
    }, [])
    if (downloadingModels.filter(m => m === modelType).length > 0) {
        return (
            <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
                <div className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{ width: progress.rate + "%" }}> {progress.rate}%</div>
            </div>
        )
    }
    return (<></>)
}

export { ModelDownloadWhisperProgress }