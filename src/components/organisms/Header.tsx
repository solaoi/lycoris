import { useRecoilValue } from "recoil"
import { recordState } from "../../store/atoms/recordState"
import { AudioDevices } from "../molecules/AudioDevice"
import { MemoFilterButton } from "../molecules/MemoFilterButton"
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
            <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 bg-white shadow flex items-center group relative overflow-x-hidden">
                <h1 className="text-3xl tracking-tight font-bold text-gray-900 flex-1">
                    ノートタイトルダミー
                </h1>
                <div className="flex-none">
                    {isRecording ? <RecordStopButton /> : <RecordStartButton />}
                </div>
                {/* shine box */}
                <div className={`absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-red-100 opacity-40 ${isRecording && "animate-shine"}`} />
            </div>
            <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8 bg-white shadow flex items-center">
                <MemoFilterButton />
            </div>
        </header>
    )
}

export { Header }