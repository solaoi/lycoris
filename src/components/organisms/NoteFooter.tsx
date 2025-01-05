import { useRef, KeyboardEvent, useEffect, useState } from 'react'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { selectedNoteState } from '../../store/atoms/selectedNoteState'
import { speechHistoryState } from '../../store/atoms/speechHistoryState'
import { AppWindow } from '../molecules/AppWindow'
import { ActionSet } from '../molecules/ActionSet'
import { settingKeyState } from '../../store/atoms/settingKeyState'
import { actionState } from '../../store/atoms/actionState'

type NoteFooterProps = {
    titleRef: React.RefObject<HTMLInputElement>
}

const NoteFooter = (props: NoteFooterProps): JSX.Element => {
    const { titleRef } = props;
    const inputEl = useRef<HTMLTextAreaElement>(null)
    const [inputValue, setInputValue] = useState("")
    const inputActionEl = useRef<HTMLTextAreaElement>(null)
    const [inputActionValue, setInputActionValue] = useState("")
    const [isMemo, setIsMemo] = useState(true)
    const settingKeyOpenai = useRecoilValue(settingKeyState("settingKeyOpenai"))
    const selectedNote = useRecoilValue(selectedNoteState)
    const setHistories = useSetRecoilState(speechHistoryState(selectedNote!.note_id))
    const targetAction = useRecoilValue(actionState)
    const update = (type: "memo" | "action", action_type?: "chat" | "suggest") => {
        if (type === "memo") {
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
        } else if (type === "action") {
            if (action_type === "chat") {
                if (inputActionValue === "") {
                    return
                }
                setHistories(prev =>
                    [...prev, {
                        speech_type: "action",
                        action_type: "chat",
                        created_at_unixtime: Math.floor(new Date().getTime() / 1000),
                        content: inputActionValue,
                        wav: "",
                        model: "manual",
                        model_description: "manual",
                        note_id: selectedNote!.note_id
                    }]
                )
                inputActionEl.current?.focus();
                setInputActionValue("")
            } else if (action_type === "suggest") {
                setHistories(prev =>
                    [...prev, {
                        speech_type: "action",
                        action_type: "suggest",
                        created_at_unixtime: Math.floor(new Date().getTime() / 1000),
                        content: "",
                        wav: "",
                        model: "manual",
                        model_description: "manual",
                        note_id: selectedNote!.note_id
                    }]
                )
            }
        }
    };
    const clear = (type: "memo" | "action", e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value === "\n") {
            if (type === "memo") {
                setInputValue("")
            } else if (type === "action") {
                setInputActionValue("")
            }
        }
    }
    const enter = async (type: "memo" | "action", e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (!(e.shiftKey && e.key === 'Enter')) {
            return
        }
        update(type, type === "action" ? "chat" : undefined);
    }

    useEffect(() => {
        if (inputEl.current && (document.activeElement !== titleRef.current)) {
            inputEl.current.focus();
        }
        if (inputActionEl.current && (document.activeElement !== titleRef.current)) {
            inputActionEl.current.focus();
        }
    }, [selectedNote]);

    return (
        <div className="ml-[-1.25rem] fixed bottom-0 right-0 mb-3 py-2 px-2 mr-16 flex items-center rounded-2xl w-7/12 h-[7.5rem] bg-base-200 drop-shadow-md">
            <div className="tabs tabs-boxed bg-base-100 absolute top-[-16px] left-2 border">
                <a className={"tab tab-xs" + (isMemo ? " tab-active" : "")}
                    onClick={() => { setIsMemo(true); }}
                >メモ</a>
                <a className={"tab tab-xs" + (isMemo ? "" : " tab-active") + (settingKeyOpenai === "" ? " hidden" : "")}
                    onClick={() => { setIsMemo(false); }}
                >各種アクション</a>
            </div>
            {isMemo && <>
                <div className={"flex-1 flex flex-col mr-2 relative"}>
                    <textarea value={inputValue} rows={3} ref={inputEl} placeholder="書き留めたいこと…" className="scrollbar-transparent pr-16 resize-none leading-6 rounded-2xl flex-1 w-full textarea textarea-bordered bg-white focus:outline-none" onKeyDown={e => enter("memo", e)} onKeyUp={e => clear("memo", e)} onChange={(e) => setInputValue(e.target.value)} />
                    <button disabled={inputValue === ""} className="w-12 h-12 absolute bottom-0 right-0 mb-5 mr-2 btn bg-white border border-solid border-neutral-300 text-primary" onClick={() => update("memo")}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.06.025Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                <div className={"flex flex-col items-center"}>
                    <AppWindow />
                </div>
            </>}
            {!isMemo && targetAction === "チャット" &&
                <div className={"flex-1 flex flex-col mr-2 relative"}>
                    <textarea value={inputActionValue} rows={3} ref={inputActionEl} placeholder="今回の記録を活用し、アシスタントにやってもらいたいこと…" className="scrollbar-transparent pr-16 resize-none leading-6 rounded-2xl flex-1 w-full textarea textarea-bordered bg-white focus:outline-none" onKeyDown={e => enter("action", e)} onKeyUp={e => clear("action", e)} onChange={(e) => setInputActionValue(e.target.value)} />
                    <button disabled={inputActionValue === ""} className="w-12 h-12 absolute bottom-0 right-0 mb-5 mr-2 btn bg-white border border-solid border-neutral-300 text-primary" onClick={() => update("action", "chat")}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.06.025Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            }
            {!isMemo && targetAction === "発話サジェスト" &&
                <div className={"flex-1 flex flex-col mr-2 relative h-[5.5rem]"}>
                    <div className="rounded-2xl flex-1 w-full pt-2 pl-3 cursor-default bg-white">
                        <p className='font-medium text-sm'>アシスタントが最適な発話をサジェスト</p>
                        <p className='text-xs'>ボタン1つで状況に応じた3つの発話を提案</p>
                        <div className='flex mt-2 text-sm'>
                            <div className='flex items-center bg-gray-100 rounded-lg py-1 px-2 mr-2'>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM7 8.5c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S5.448 7 6 7s1 .672 1 1.5Zm5 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S10.448 7 11 7s1 .672 1 1.5Zm-6.5 5.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                                </svg>
                                <p className='pl-1'>ニュートラル</p>
                            </div>
                            <div className='flex items-center bg-gray-100 rounded-lg py-1 px-2 mr-2 text-primary'>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.536-4.464a.75.75 0 1 0-1.061-1.061 3.5 3.5 0 0 1-4.95 0 .75.75 0 0 0-1.06 1.06 5 5 0 0 0 7.07 0ZM9 8.5c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S7.448 7 8 7s1 .672 1 1.5Zm3 1.5c.552 0 1-.672 1-1.5S12.552 7 12 7s-1 .672-1 1.5.448 1.5 1 1.5Z" clipRule="evenodd" />
                                </svg>
                                <p className='pl-1'>ポジティブ</p>
                            </div>
                            <div className='flex items-center bg-gray-100 rounded-lg py-1 px-2 text-error'>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-3.536-3.475a.75.75 0 0 0 1.061 0 3.5 3.5 0 0 1 4.95 0 .75.75 0 1 0 1.06-1.06 5 5 0 0 0-7.07 0 .75.75 0 0 0 0 1.06ZM9 8.5c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S7.448 7 8 7s1 .672 1 1.5Zm3 1.5c.552 0 1-.672 1-1.5S12.552 7 12 7s-1 .672-1 1.5.448 1.5 1 1.5Z" clipRule="evenodd" />
                                </svg>
                                <p className='pl-1'>ネガティブ</p>
                            </div>
                        </div>
                    </div>
                    <button className="w-12 h-12 absolute bottom-0 right-0 mb-5 mr-2 btn bg-white border border-solid border-neutral-300 text-primary" onClick={() => update("action", "suggest")}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            }
            {!isMemo &&
                <div className={"flex flex-col items-center w-52" + (isMemo ? " hidden" : "")}>
                    <ActionSet />
                </div>
            }
        </div>
    )
}

export { NoteFooter }