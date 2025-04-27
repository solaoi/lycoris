import { useRef, Fragment } from "react"

type AgentSpeechProps = {
    speech_id: number
    date: string
    content: string
}

const AgentSpeech = (props: AgentSpeechProps): JSX.Element => {
    const { speech_id, date, content } = props
    const targetRef = useRef(null);

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
        <div>
            <div className={"flex mb-1 cursor-default"}
                ref={targetRef} >
                <div className="w-16 pl-2 flex-none text-gray-500/60 text-sm flex content-start pt-[0.15rem]">{date}</div>
                <div className="pt-2 pr-[10px]" >
                    <svg width="8" height="8" viewBox="0, 0, 8, 8" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="4" cy="4" r="3.6" opacity="0.6" fill="#10b981" />
                    </svg>
                </div>
                <div className="pr-2">{addNewLine(content, speech_id.toString())}</div>
            </div>
        </div>
    )
}

export { AgentSpeech }