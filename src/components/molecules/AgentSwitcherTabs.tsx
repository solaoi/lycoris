import { useEffect, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { agentSwitcherState } from '../../store/atoms/agentSwitcherState';
import { selectedNoteState } from "../../store/atoms/selectedNoteState";
import { Agent } from "../../type/Agent.type";
import { CheckCircle } from "../atoms/CheckCircle";

type AgentSwitcherTabsProps = {
    agents: Agent[];
    selectedAgent: string[];
    agentIdsWithNote: number[];
}

const AgentSwitcherTabs = (props: AgentSwitcherTabsProps): JSX.Element => {
    const { agents, selectedAgent, agentIdsWithNote } = props;
    const [activeTab, setActiveTab] = useState(0);
    const setAgentSwitcher = useSetRecoilState(agentSwitcherState)

    const selectedNote = useRecoilValue(selectedNoteState)
    useEffect(() => {
        setActiveTab(0)
        setAgentSwitcher(null)
    }, [selectedNote]);

    const selectedAgentIds = selectedAgent
        .map(agentName => agents.find(agent => agent.name === agentName))
        .filter(agent => agent !== undefined)
        .map(agent => agent.id);
    const tabIds = [...new Set([...selectedAgentIds, ...agentIdsWithNote])]

    return (
        <div className="tabs">
            <a className={"tab tab-lifted border-none" + (activeTab === 0 ? " tab-active" : "")}
                onClick={() => { setActiveTab(0); setAgentSwitcher(null); }}>
                デフォルト
            </a>
            {tabIds
                .map((id) => (
                    <a key={`agent-switcher-tab-${id}`} className={"tab tab-lifted border-none" + (activeTab === id ? " tab-active" : "")}
                        onClick={() => { setActiveTab(id); setAgentSwitcher(id); }}>
                        {selectedAgentIds.includes(id) ? <div className="mr-1"><CheckCircle /></div> : <></>}
                        {agents.find(agent => agent.id === id)?.name}
                    </a>
                ))}
        </div>
    )
}

export { AgentSwitcherTabs }