import { useState } from "react"
import { AudioPlayer } from "./AudioPlayer"
import { convertFileSrc } from '@tauri-apps/api/tauri';

type SpeechProps = {
    model: string
    date: string
    content: string
    wav: string
}

const Speech = (props: SpeechProps): JSX.Element => {
    const { model, date, content, wav } = props
    const [isHover, setHover] = useState(false)

    return (
        <div onMouseLeave={() => setHover(false)} >
            {/* (model === "vosk" ? "  text-gray-400" : "") */}
            <div className={"flex pb-1 cursor-pointer" + (isHover && " bg-gray-400 text-white rounded")} onMouseEnter={() => setHover(true)} >
                <div className="w-16 flex-none">{date}</div>
                <div>{content}</div>
            </div>
            {isHover && <AudioPlayer filePath={convertFileSrc(wav, "stream")} />}
        </div>
    )
}

export { Speech }