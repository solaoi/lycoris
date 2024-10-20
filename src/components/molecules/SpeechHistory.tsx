import { useRecoilValue } from 'recoil'
import dayjs from '../../lib/dayjs'
import { speechFilterState } from '../../store/atoms/speechFilterState'
import { SpeechHistoryType } from '../../type/SpeechHistory.type'
import { Speech } from './Speech'
import { Screenshot } from './Screenshot'
import { MyMarkdown } from './MyMarkdown'
import 'zenn-content-css';
import { selectedNoteState } from '../../store/atoms/selectedNoteState'
import { useState } from 'react'
import { SuggestCard } from './SuggestCard'

type SpeechHistoryProps = {
    histories: SpeechHistoryType[]
    setHistories: (valOrUpdater: SpeechHistoryType[] | ((currVal: SpeechHistoryType[]) => SpeechHistoryType[])) => void
}

const SpeechHistory = (props: SpeechHistoryProps): JSX.Element => {
    const { histories = [], setHistories } = props
    const filterTarget = useRecoilValue(speechFilterState)
    const filterdHistories = histories.filter(
        h => {
            if (filterTarget === "speech") {
                return h.speech_type === "speech"
            } else if (filterTarget === "memo") {
                return h.speech_type === "memo"
            } else if (filterTarget === "screenshot") {
                return h.speech_type === "screenshot"
            } else if (filterTarget === "action") {
                return h.speech_type === "action"
            } else {
                return true
            }
        }
    );
    const selectedNote = useRecoilValue(selectedNoteState)
    const [editMemoId, setEditMemoId] = useState<number | null>(null)

    return (
        <div>
            {filterdHistories.reduce(
                (acc, c, i) => {
                    let date = dayjs.unix(c.created_at_unixtime).format('H:mm')
                    if (i > 0 && date === dayjs.unix(acc[i - 1].created_at_unixtime).format('H:mm')) {
                        date = ""
                    }
                    let cal = dayjs.unix(c.created_at_unixtime).format('YYYY-M-D')
                    if (i > 0 && cal === dayjs.unix(acc[i - 1].created_at_unixtime).format('YYYY-M-D')) {
                        cal = ""
                    }
                    return [...acc, {
                        el: (<div key={"history_" + i}>
                            {cal && <div className={(i > 0 ? 'mt-6 ' : '') + 'mb-2'}>[{cal}]</div>}
                            {c.speech_type === "memo"
                                && <div className='flex py-1' key={"memo_" + i}>
                                    <div className="w-16 pl-2 flex-none">{date}</div>
                                    <div className="flex flex-col items-start ml-5 cursor-pointer hover:border-base-300 border-2 border-transparent rounded-lg"
                                        onDoubleClick={(e) => { e.preventDefault(); setEditMemoId(i); }}>
                                        {editMemoId === null || editMemoId !== i ?
                                            <MyMarkdown content={c.content} title={`${selectedNote?.note_title.trim()}_memo_${i}`} />
                                            : <textarea rows={c.content.split("\n").length} value={c.content} autoFocus onBlur={() => { setEditMemoId(null) }} />}
                                    </div>
                                </div>}
                            {
                                c.speech_type === "action"
                                && <div className='flex py-2' key={"action_" + i}>
                                    <div className="w-16 pl-2 flex-none">{date}</div>
                                    <div className="card w-4/5 bg-base-200 shadow-xl ml-5">
                                        <div className="card-body">
                                            {c.action_type === "chat" &&
                                                <>
                                                    <div className="chat chat-start">
                                                        <div className="flex chat-bubble bg-white text-slate-500">
                                                            <MyMarkdown content={c.content} title={`${selectedNote?.note_title.trim()}_action-start_${i}`} />
                                                        </div>
                                                    </div>
                                                    <div className="chat chat-end">
                                                        <div className="flex chat-bubble bg-white text-slate-500 py-5 w-full">
                                                            {c.content_2 ?
                                                                <MyMarkdown content={c.content_2} title={`${selectedNote?.note_title.trim()}_action-end_${i}`} />
                                                                :
                                                                <span className="loading loading-dots loading-sm"></span>
                                                            }
                                                        </div>
                                                    </div>
                                                </>
                                            }
                                            {c.action_type === "suggest" &&
                                                <div className="chat chat-start">
                                                    <div className="flex chat-bubble bg-white text-slate-500">
                                                        {c.content_2 ?
                                                            <SuggestCard
                                                                id={c.id!}
                                                                active={c.content}
                                                                suggestions={c.content_2}
                                                                update={
                                                                    (id, active) => {
                                                                        setHistories((prev) => {
                                                                            return prev.map(h => {
                                                                                if (h.id === id) { return { ...h, content: active } } else { return h }
                                                                            })
                                                                        })
                                                                    }} />
                                                            :
                                                            <span className="loading loading-dots loading-sm"></span>
                                                        }
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            }
                            {
                                c.speech_type === "screenshot"
                                && <div className="py-2"><Screenshot content={c.content} date={date} /></div>
                            }
                            {
                                c.speech_type === "speech"
                                && <Speech model={c.model} model_description={c.model_description} date={date} content={c.content} wav={c.wav} />
                            }
                        </div>), created_at_unixtime: c.created_at_unixtime
                    }];
                }, [] as { el: JSX.Element, created_at_unixtime: number }[])
                .map(obj => obj.el)
            }
        </div >
    )
}

export { SpeechHistory }