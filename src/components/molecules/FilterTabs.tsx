import { useEffect, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil";
import { speechFilterState } from '../../store/atoms/speechFilterState'
import { speechHistoryState } from "../../store/atoms/speechHistoryState";
import { selectedNoteState } from "../../store/atoms/selectedNoteState";

const FilterTabs = (): JSX.Element => {
    const [activeTab, setActiveTab] = useState(0);
    const setFilterTarget = useSetRecoilState(speechFilterState)
    const selectedNote = useRecoilValue(selectedNoteState)
    const histories = useRecoilValue(speechHistoryState(selectedNote!.note_id))
    const hasSpeech = histories.some(history => history.speech_type === "speech")
    const hasMemo = histories.some(history => history.speech_type === "memo")
    const hasScreenshot = histories.some(history => history.speech_type === "screenshot")
    const hasAction = histories.some(history => history.speech_type === "action")

    useEffect(() => {
        setActiveTab(0)
        setFilterTarget(null)
    }, [selectedNote]);

    return (
        <div className="tabs">
            <a className={"tab tab-lifted border-none" + (activeTab === 0 ? " tab-active" : "")}
                onClick={() => { setActiveTab(0); setFilterTarget(null); }}>
                全て
            </a>
            <a className={"tab tab-lifted border-none" + (activeTab === 1 ? " tab-active" : "") + (!hasSpeech ? " hidden" : "")}
                onClick={() => { setActiveTab(1); setFilterTarget("speech"); }}>
                発言
            </a>
            <a className={"tab tab-lifted border-none" + (activeTab === 2 ? " tab-active" : "") + (!hasMemo ? " hidden" : "")}
                onClick={() => { setActiveTab(2); setFilterTarget("memo"); }}>
                メモ
            </a>
            <a className={"tab tab-lifted border-none" + (activeTab === 3 ? " tab-active" : "") + (!hasScreenshot ? " hidden" : "")}
                onClick={() => { setActiveTab(3); setFilterTarget("screenshot") }}>
                スクリーンショット
            </a>
            <a className={"tab tab-lifted border-none" + (activeTab === 4 ? " tab-active" : "") + (!hasAction ? " hidden" : "")}
                onClick={() => { setActiveTab(4); setFilterTarget("action") }}>
                アクション
            </a>
        </div>)
}

export { FilterTabs }