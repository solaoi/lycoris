import { useRef, useState, useEffect, Fragment } from "react"
import { AudioPlayer } from "./AudioPlayer"
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { useGetElementProperty } from "../../hooks/useGetElementProperty";
import happy from "../../assets/emotion/happy.png";
import sad from "../../assets/emotion/sad.png";
import angry from "../../assets/emotion/angry.png";
import { useRecoilValue } from "recoil";
import { emotionWithNoteState } from "../../store/atoms/emotionWithNoteState";
import { selectedNoteState } from "../../store/atoms/selectedNoteState";


type SpeechProps = {
    model: string
    model_description: string
    date: string
    content: string
    wav: string
    emotion?: number
}

const Speech = (props: SpeechProps): JSX.Element => {
    const { model, date, content, wav, emotion = 0 } = props
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
    const selectedNote = useRecoilValue(selectedNoteState)
    const hasEmotion = useRecoilValue(emotionWithNoteState(selectedNote!.note_id))

    return (
        <div className="flex items-center" onMouseLeave={leave} >
            {hasEmotion === 1 && (emotion > 1 ? <div className="flex items-center mr-2">
                <div className="size-4 flex-shrink-0">
                    <img src={emotion === 2 ? happy : emotion === 3 ? angry : emotion === 4 ? sad : ""} alt="emotion" />
                </div>
            </div> : <div className="size-4 flex-shrink-0 mr-2"></div>)}
            <div className={"flex mb-1 cursor-pointer hover:bg-gray-400 hover:text-white hover:rounded flex-grow"}
                onClick={() => setHover(true)}
                ref={targetRef} >
                <div className="w-16 pl-2 flex-none text-gray-500/60 text-sm flex content-start pt-[0.15rem]">{date}</div>
                <div className="pt-2 pr-[10px]" >
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
                        width: width * 4 / 5,
                        zIndex: 1
                    }}
                />}
        </div>
    )
}

export { Speech }