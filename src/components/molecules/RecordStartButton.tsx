import { useRecoilState, useRecoilValue } from 'recoil'
import { audioDeviceState } from '../../atoms/audioDeviceState';
import { invoke } from '@tauri-apps/api/tauri'
import { recordState } from '../../atoms/recordState';

const RecordStartButton = (): JSX.Element => {
    const deviceId = useRecoilValue(audioDeviceState)
    const [_, setRecording] = useRecoilState(recordState)
    const click = () => {
        setRecording(true)
        invoke('start_command', { deviceId })
    }

    return (
        <button className="btn gap-2 glass text-primary" onClick={click}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            録音開始
        </button>
    )
}

export { RecordStartButton }