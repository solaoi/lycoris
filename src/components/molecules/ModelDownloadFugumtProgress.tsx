import { useRecoilState, useSetRecoilState } from 'recoil'
import { modelFugumtDownloadingState } from '../../store/atoms/modelFugumtDownloadingState'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useState } from 'react'
import { ProgressType } from '../../type/progress.type'
import { modelFugumtDownloadedState } from '../../store/atoms/modelFugumtDownloadedState'

const ModelDownloadFugumtProgress = (): JSX.Element => {
    const modelType = "fugumt-en-ja"
    const setDownloadedModel = useSetRecoilState(modelFugumtDownloadedState)
    const [downloadingModels, setDownloadingModels] = useRecoilState(modelFugumtDownloadingState)
    const [progress, setProgress] = useState<ProgressType>({
        model_type: modelType,
        rate: 0,
        is_progress: false
    })
    useEffect(() => {
        const unlisten = listen('downloadFugumtProgress', event => {
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

export { ModelDownloadFugumtProgress }