import { useEffect, useState } from "react";
import { SettingAgents } from "./SettingAgents"
import { invoke } from "@tauri-apps/api";
import { Agent } from "../../type/Agent.type";
import { SettingAgentAddButton } from "./SettingAgentAddButton";

const SettingAgentContent = (): JSX.Element => {
    const [agents, setAgents] = useState<Agent[]>([]);
    useEffect(() => {
        invoke('select_all_agents_command').then((arr) => {
            const agents = arr as { id: number, name: string, has_workspace: number, mode: number, role_prompt: string, tool_list: string[] }[];
            setAgents(agents.map(agent => ({
                id: agent.id,
                name: agent.name,
                has_workspace: agent.has_workspace,
                mode: agent.mode,
                role_prompt: agent.role_prompt,
                tool_list: agent.tool_list
            })));
        });
    }, [setAgents]);
    const addAgent = (agent: Agent) => {
        setAgents(prev => [...prev, agent]);
    }
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const addSelectedAgents = (agentName: string) => {
        setSelectedAgents(prev => [...prev, agentName]);
    };
    const deleteSelectedAgents = (agentName: string) => {
        setSelectedAgents(prev => prev.filter((selectedAgent) => selectedAgent !== agentName));
    }

    return (
        <div>
            <div className="flex items-center">
                <SettingAgentAddButton addAgent={addAgent} />
                <div>
                    {selectedAgents.length > 0 && (
                        <button
                            className="btn text-secondary ml-2 bg-base-100 border border-solid border-neutral-300"
                            onClick={async () => {
                                await invoke('delete_agents_command', { agentNames: selectedAgents })
                                    .then(async () => {
                                        setAgents(prev => prev.filter((agent) => !selectedAgents.includes(agent.name)));
                                        setSelectedAgents([]);
                                    });
                            }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                            </svg>
                            {selectedAgents.length}個のエージェントを削除
                        </button>
                    )}
                </div>
            </div>
            <div className="mt-4">
                <SettingAgents agents={agents} addSelectedAgents={addSelectedAgents} deleteSelectedAgents={deleteSelectedAgents} />
            </div>
        </div>
    )
}

export { SettingAgentContent }
