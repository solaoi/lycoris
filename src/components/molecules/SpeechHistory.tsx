import { useRecoilValue } from 'recoil'
import dayjs from '../../lib/dayjs'
import { memoFilterState } from '../../store/atoms/memoFilterState'
import { SpeechHistoryType } from '../../type/SpeechHistory.type'
import { Speech } from './Speech'
import { markdownToSimpleHtml } from 'zenn-markdown-html';
import 'zenn-content-css';

type SpeechHistoryProps = {
    histories: SpeechHistoryType[]
}

const SpeechHistory = (props: SpeechHistoryProps): JSX.Element => {
    const { histories = [] } = props
    const filterd = useRecoilValue(memoFilterState)

    return (
        <div>
            {histories.filter(
                h => { if (filterd) { return h.speech_type === "memo" } else { return true } }
            ).map((h, i) => {
                if (h.speech_type === "memo") {
                    return (
                        <div className='flex items-center mb-1 cursor-pointer hover:rounded hover:bg-gray-400 hover:text-white' key={"memo_" + i}>
                            <div className="w-16 pl-2 flex-none" />
                            <div className='pr-[10px]'>
                                <svg width="8" height="8" viewBox="0, 0, 8, 8" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="8" height="8" opacity="0.6" />
                                </svg>
                            </div>
                            <div className="pr-2 znc" dangerouslySetInnerHTML={{ __html: markdownToSimpleHtml(h.content) }} />
                        </div>
                    )
                }
                let date = dayjs.unix(h.created_at_unixtime).format('H:mm')
                if (i > 0 && date === dayjs.unix(histories[i - 1].created_at_unixtime).format('H:mm')) {
                    date = ""
                }
                let cal = dayjs.unix(h.created_at_unixtime).format('YYYY-M-D')
                if (i > 0 && cal === dayjs.unix(histories[i - 1].created_at_unixtime).format('YYYY-M-D')) {
                    cal = ""
                }
                return (<>
                    {cal && <div className={(i > 0 ? 'mt-6 ' : '') + 'mb-2'}>[{cal}]</div>}
                    <Speech key={"history_" + i} model={h.model} model_description={h.model_description} date={date} content={h.content} wav={h.wav} />
                </>)
            }
            )}
        </div>
    )
}

export { SpeechHistory }