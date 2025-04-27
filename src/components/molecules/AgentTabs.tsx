import { useEffect, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil";
import { agentTabState } from '../../store/atoms/agentTabState'
import { selectedNoteState } from "../../store/atoms/selectedNoteState";
import { Agent } from "../../type/Agent.type";


type AgentTabProps = {
    agents: Agent[]
    agentId: number | null
}

const AgentTabs = (AgentTabProps: AgentTabProps): JSX.Element => {
    const { agents, agentId } = AgentTabProps
    const [activeTab, setActiveTab] = useState(0);
    const setFilterTarget = useSetRecoilState(agentTabState)
    const selectedNote = useRecoilValue(selectedNoteState)
    useEffect(() => {
        const agent = agents.find(agent => agent.id === agentId)
        if (agent?.mode === 0) {
            setActiveTab(0)
            setFilterTarget(null)
        } else if (agent?.has_workspace === 1) {
            setActiveTab(1)
            setFilterTarget("workspace")
        }
    }, [selectedNote, agents, agentId]);

    return (agentId === null ? <></> :
        <div className="tabs">
            <a className={"tab tab-lifted border-none" + (activeTab === 0 ? " tab-active" : "") + (agents.find(agent => agent.id === agentId)?.mode === 0 ? "" : " hidden")}
                onClick={() => { setActiveTab(0); setFilterTarget(null); }}>
                発言
            </a>
            <a className={"tab tab-lifted border-none" + (activeTab === 1 ? " tab-active" : "") + (agents.find(agent => agent.id === agentId)?.has_workspace === 0 ? " hidden" : "")}
                onClick={() => { setActiveTab(1); setFilterTarget("workspace"); }}>
                ワークスペース
            </a>
        </div>)
}

export { AgentTabs }