import { ChangeEvent } from "react";
import { useAudioDevices } from "../../hooks/useAudioDevices"
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { audioDeviceState } from "../../store/atoms/audioDeviceState";
import { recordState } from '../../store/atoms/recordState';

const AudioDevices = (): JSX.Element => {
    const audioDevices = useAudioDevices()
    const setAudioDevice = useSetRecoilState(audioDeviceState)
    const isRecording = useRecoilValue(recordState)

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const deviceLabel = e.target.value
        setAudioDevice(deviceLabel)
    }

    return (
        <select className="select select-bordered w-full max-w-xs focus:outline-none text-xs disabled:bg-base-300" name="audio-devices" disabled={isRecording} onChange={change} defaultValue={"mic-selector"} >
            <option disabled value="mic-selector">利用するマイク</option>
            {audioDevices?.map((device, i) => (
                <option key={"audio-device" + i} value={device.label}>{device.label}</option>
            ))}
        </select>
    )
}

export { AudioDevices }
