import { useRef, useState, useEffect } from "react"
import { AudioPlayer } from "./AudioPlayer"
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { useGetElementProperty } from "../../hooks/useGetElementProperty";

type SpeechProps = {
    model: string
    model_description: string
    date: string
    content: string
    wav: string
}

const Speech = (props: SpeechProps): JSX.Element => {
    const { model, date, content, wav } = props
    const [isHover, setHover] = useState(false)
    const [lazyHoverId, setLazyHoverId] = useState(0)
    const [isLazyHover, setLazyHover] = useState(false)
    const targetRef = useRef(null);
    const { getElementProperty } = useGetElementProperty<HTMLDivElement>(targetRef);
    const width = getElementProperty("width");
    const bottom = getElementProperty("bottom");
    const leave = () => {
        setHover(false);
        clearTimeout(lazyHoverId);
        setLazyHover(false);
    }
    const scroll = () => {
        setLazyHover(false);
    }
    useEffect(() => {
        window.addEventListener('scroll', scroll)
        return () => window.removeEventListener('scroll', scroll)
    }, [])

    return (
        <div onMouseLeave={leave} >
            <div className={"flex mb-1 cursor-pointer" + (isHover && " bg-gray-400 text-white rounded")}
                onClick={() => setLazyHover(true)}
                onMouseEnter={() => {
                    setHover(true);
                    if (window.innerHeight - bottom > 100) {
                        setLazyHoverId(setTimeout(() => { setLazyHover(true) }, 1000));
                    }
                }} ref={targetRef} >
                <div className="w-16 pl-2 flex-none">{date}</div>
                <div style={{ paddingTop: "0.5rem", paddingRight: "10px" }}>
                    <svg width="8" height="8" viewBox="0, 0, 8, 8" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="4" cy="4" r="3.6" opacity="0.6" {...(model !== "vosk" ? { fill: "#10b981" } : {})} />
                    </svg>
                </div>
                <div className="pr-2">{content}</div>
            </div>
            {isLazyHover &&
                <AudioPlayer filePath={convertFileSrc(wav, "stream")}
                    className="animate-fade-in"
                    style={{
                        position: "absolute",
                        top: bottom,
                        left: getElementProperty("left") + width / 10,
                        width: width * 4 / 5
                    }}
                />}
        </div>
    )
}

export { Speech }