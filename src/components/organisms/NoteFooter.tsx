import { useRef, KeyboardEvent, useEffect, useState } from 'react'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { selectedNoteState } from '../../store/atoms/selectedNoteState'
import { speechHistoryState } from '../../store/atoms/speechHistoryState'
import { AppWindow } from '../molecules/ScreenshotSet'

type NoteFooterProps = {
    titleRef: React.RefObject<HTMLInputElement>
}

const NoteFooter = (props: NoteFooterProps): JSX.Element => {
    const { titleRef } = props;
    const inputEl = useRef<HTMLTextAreaElement>(null)
    const [inputValue, setInputValue] = useState("")
    const selectedNote = useRecoilValue(selectedNoteState)
    const setHistories = useSetRecoilState(speechHistoryState(selectedNote!.note_id))
    const update = () => {
        if (inputValue === "") {
            return
        }
        setHistories(prev =>
            [...prev, {
                speech_type: "memo",
                created_at_unixtime: Math.floor(new Date().getTime() / 1000),
                content: inputValue,
                wav: "",
                model: "manual",
                model_description: "manual",
                note_id: selectedNote!.note_id
            }]
        )
        inputEl.current?.focus();
        setInputValue("")
    };
    const clear = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.shiftKey && e.key === 'Enter' && e.currentTarget.value === "\n") {
            setInputValue("")
        }
    }
    const enter = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (!(e.shiftKey && e.key === 'Enter')) {
            return
        }
        update();
    }

    useEffect(() => {
        if (inputEl.current && (document.activeElement !== titleRef.current)) {
            inputEl.current.focus();
        }
    }, [selectedNote]);

    return (
        <div className="ml-[-1.25rem] fixed bottom-0 right-0 mb-3 py-2 px-2 mr-16 flex items-center glass rounded-2xl w-1/2">
            <div className="flex-1 flex flex-col mr-2 relative">
                <textarea value={inputValue} rows={3} ref={inputEl} placeholder="メモ…" className="scrollbar-transparent pr-16 resize-none leading-6 rounded-2xl flex-1 w-full textarea textarea-bordered bg-white focus:outline-none" onKeyDown={e => enter(e)} onKeyUp={e => clear(e)} onChange={(e) => setInputValue(e.target.value)} />
                <button disabled={inputValue === ""} className="w-12 h-12 absolute bottom-0 right-0 mb-5 mr-2 btn glass border border-solid border-neutral-300 text-primary" onClick={update}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.06.025Z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className='flex flex-col items-center'>
                <AppWindow />
            </div>
        </div>
    )
}

export { NoteFooter }