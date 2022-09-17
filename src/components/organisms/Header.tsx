import { useRecoilValue } from "recoil"
import { recordState } from "../../atoms/recordState"
import { AudioDevices } from "../molecules/AudioDevice"
import { RecordStartButton } from "../molecules/RecordStartButton"
import { RecordStopButton } from "../molecules/RecordStopButton"

const Header = (): JSX.Element => {
    const isRecording = useRecoilValue(recordState)

    return (
        <header className="sticky top-0">
            <div className="navbar bg-base-200">
                <div className="flex-1">
                    <a className="btn btn-ghost normal-case text-xl text-primary">Lycoris</a>
                </div>
                <div className="flex-none">
                    <AudioDevices />
                </div>
            </div>
            <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 bg-white shadow flex items-center">
                <h1 className="text-3xl tracking-tight font-bold text-gray-900 flex-1">
                    今日の議事録
                </h1>
                <div className="flex-none">
                    {isRecording ? <RecordStopButton /> : <RecordStartButton />}
                </div>
            </div>
        </header>
    )
}

export { Header }