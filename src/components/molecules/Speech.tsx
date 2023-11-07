import { useRef, useState, useEffect, Fragment } from "react"
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
    const targetRef = useRef(null);
    const { getElementProperty } = useGetElementProperty<HTMLDivElement>(targetRef);
    const width = getElementProperty("width");
    const bottom = getElementProperty("bottom");
    const leave = () => {
        setHover(false);
    }
    const addNewLine = (s: string, key: string) => {
        const texts = s.split(/(\n)/).map((item, i) => {
            return (
                <Fragment key={`${key}_${i}`}>
                    {item.match(/\n/) ? <br /> : item}
                </Fragment>
            );
        });
        return <div>{texts}</div>;
    }
    return (
        <div onMouseLeave={leave} >
            <div className={"flex mb-1 cursor-pointer hover:bg-gray-400 hover:text-white hover:rounded"}
                onClick={() => setHover(true)}
                ref={targetRef} >
                <div className="w-16 pl-2 flex-none">{date}</div>
                <div style={{ paddingTop: "0.5rem", paddingRight: "10px" }}>
                    <svg width="8" height="8" viewBox="0, 0, 8, 8" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="4" cy="4" r="3.6" opacity="0.6" {...(model !== "vosk" ? { fill: "#10b981" } : {})} />
                    </svg>
                </div>
                <div className="pr-2">{addNewLine(content, wav)}</div>
            </div>
            {isHover &&
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