import { useRecoilState, useSetRecoilState } from 'recoil'
import { modelWhisperDownloadingState } from '../../store/atoms/modelWhisperDownloadingState'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useState } from 'react'
import { ProgressType } from '../../type/progress.type'
import { modelWhisperDownloadedState } from '../../store/atoms/modelWhisperDownloadedState'

type Props = {
    modelType: string
}

const ModelDownloadWhisperProgress = (props: Props): JSX.Element => {
    const { modelType } = props
    const setDownloadedModel = useSetRecoilState(modelWhisperDownloadedState)
    const [downloadingModels, setDownloadingModels] = useRecoilState(modelWhisperDownloadingState)
    const [progress, setProgress] = useState<ProgressType>({
        model_type: modelType,
        rate: 0,
        is_progress: false
    })
    useEffect(() => {
        const unlisten = listen('downloadWhisperProgress', event => {
            const p = event.payload as ProgressType
            if (p.model_type === modelType) {
                setProgress(p)
                if (!p.is_progress) {
                    setDownloadingModels(prev => prev.filter(m => m !== modelType))
                    setDownloadedModel(prev => [...prev, modelType])
                }
            }
        })
        return () => {
            unlisten.then(f => f());
        }
    }, [])
    if (downloadingModels.filter(m => m === modelType).length > 0) {
        return (
            <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
                <div className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{ width: `${progress.rate}%` }}>{progress.rate === 100 ? "解凍中" : `${progress.rate}%`}</div>
            </div>
        )
    }
    return (<></>)
}

export { ModelDownloadWhisperProgress }