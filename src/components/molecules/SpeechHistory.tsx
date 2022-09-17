import dayjs from '../../lib/dayjs'

export type SpeechHistoryType = {
    type: "speech" | "memo"
    date: Date
    content: string
}

type SpeechHistoryProps = {
    histories: SpeechHistoryType[]
}

const SpeechHistory = (props: SpeechHistoryProps): JSX.Element => {
    const { histories = [] } = props

    return (
        <div>
            {histories.map((h, i) => {
                if (h.type === "memo") {
                    return (
                        <div className='flex pb-1'>
                            <div className="w-16 flex-none" />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            <p className="ml-2">{h.content}</p>
                        </div>
                    )
                }
                let date = dayjs(h.date).format('H:mm')
                if (i > 0 && date === dayjs(histories[i - 1].date).format('H:mm')) {
                    date = ""
                }
                return (
                    <div className="flex pb-1" key={"history_" + i}>
                        <div className="w-16 flex-none">{date}</div>
                        <div>{h.content}</div>
                    </div>
                )
            }
            )}
        </div>
    )
}

export { SpeechHistory }