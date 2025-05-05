import dayjs from '../../lib/dayjs'
import 'zenn-content-css';
import { CalendarDays } from '../atoms/CalendarDays'
import { AgentHistoryType } from '../../type/AgentHistory.type'
import { AgentSpeech } from './AgentSpeech';

type AgentHistoryProps = {
    agent_id: number
    histories: AgentHistoryType[]
}

const AgentHistory = (props: AgentHistoryProps): JSX.Element => {
    const { agent_id, histories = [] } = props

    return (
        <div>
            {histories
                .filter(c => c.agent_id === agent_id)
                .reduce(
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
                            el: (<div key={"agent_history_" + c.agent_id + "_" + i}>
                                {cal &&
                                    <div className={'badge bg-white shadow-md border-transparent my-4 cursor-default'} style={{ padding: "0.7rem 0.8rem", fontSize: "0.8rem" }}>
                                        <CalendarDays />
                                        <p className='ml-1'>{cal}</p>
                                    </div>}
                                <AgentSpeech speech_id={c.speech_id} date={date} content={c.content} />
                            </div>), created_at_unixtime: c.created_at_unixtime
                        }];
                    }, [] as { el: JSX.Element, created_at_unixtime: number }[])
                .map(obj => obj.el)
            }
        </div >
    )
}

export { AgentHistory }