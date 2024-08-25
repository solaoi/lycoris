import { useState } from "react"
import { useSetRecoilState } from "recoil";
import { speechFilterState } from '../../store/atoms/speechFilterState'

const FilterTabs = (): JSX.Element => {
    const [activeTab, setActiveTab] = useState(0);
    const setFilterTarget = useSetRecoilState(speechFilterState)

    return (
        <div className="tabs">
            <a className={"tab tab-lifted border-none" + (activeTab === 0 ? " tab-active" : "")}
                onClick={() => { setActiveTab(0); setFilterTarget(null); }}>
                全て
            </a>
            <a className={"tab tab-lifted border-none" + (activeTab === 1 ? " tab-active" : "")}
                onClick={() => { setActiveTab(1); setFilterTarget("memo"); }}>
                メモ
            </a>
            <a className={"tab tab-lifted border-none" + (activeTab === 2 ? " tab-active" : "")}
                onClick={() => { setActiveTab(2); setFilterTarget("screenshot") }}>
                スクリーンショット
            </a>
        </div>)
}

export { FilterTabs }