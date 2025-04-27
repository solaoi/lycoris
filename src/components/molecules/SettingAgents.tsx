import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "../atoms/ChevronRight";
import { ChevronDown } from "../atoms/ChevronDown";
import { Agent } from "../../type/Agent.type";

type SettingAgentsProps = {
    agents: Agent[]
    addSelectedAgents: (agentName: string) => void
    deleteSelectedAgents: (agentName: string) => void
}

const SettingAgents = (props: SettingAgentsProps): JSX.Element => {
    const { agents, addSelectedAgents, deleteSelectedAgents } = props
    const sortedAgentNames = useMemo(() => [...agents.map(agent => agent.name)].sort(), [agents])
    const [openDescription, setOpenDescription] = useState("")

    useEffect(() => {
        setOpenDescription("")
    }, [agents.length])

    useEffect(() => {
        if (openDescription === "") { return; }
    }, [openDescription])

    return (
        <div>
            {sortedAgentNames.map((agentName, index) => (
                <div key={`${agentName}_${index}`}>
                    <div className="flex items-center">
                        <input type="checkbox" className="checkbox" onChange={(e) => {
                            if (e.target.checked) {
                                addSelectedAgents(agentName)
                            } else {
                                deleteSelectedAgents(agentName)
                            }
                        }} />
                        <div
                            className={"flex-1 flex items-center justify-between p-2 border-b border-gray-200 cursor-pointer hover:bg-base-200 rounded ml-2"
                                + (agentName === openDescription ? " bg-base-200" : "")
                            }
                            onClick={() => {
                                if (openDescription === agentName) {
                                    setOpenDescription("");
                                } else {
                                    setOpenDescription(agentName);
                                }
                            }}>
                            <div>{agentName}</div>
                            {agentName !== openDescription ? <ChevronRight /> : <ChevronDown />}
                        </div>
                    </div>
                    {agentName === openDescription && <div className="mt-2 ml-8">
                        {agents.length === 0 ? (
                            <div className="py-3 px-6 mb-2 border border-neutral-300 rounded-md">
                                <p>利用可能なエージェント情報がありません。</p>
                            </div>
                        ) : (<>
                            <div className="px-6 py-3 mb-4 border border-neutral-300 rounded-md">
                                {agents.filter(agent => agent.name === agentName).map((t) => (
                                    <div className="py-2 px-6 mb-2 flex gap-4 flex-col">
                                        <div>
                                            <div className="mb-2 font-bold border-b border-neutral-300 pb-2">役割</div>
                                            <div className="text-sm">
                                                <p className="whitespace-pre-wrap break-words select-text cursor-text">{t.role_prompt}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-2 font-bold border-b border-neutral-300 pb-2">モード</div>
                                            <div className="text-sm">
                                                <p>{t.mode === 0 ? "発言ごとに返答" : "返答しない"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-2 font-bold border-b border-neutral-300 pb-2">ワークスペース</div>
                                            <div className="text-sm">
                                                <p>{t.has_workspace === 0 ? "無効" : "有効"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-2 font-bold border-b border-neutral-300 pb-2">直近の会話を参照</div>
                                            <div className="text-sm">
                                                <p>{t.ref_recent_conversation === 0 ? "無効" : "有効"}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center">
                                <button className="bg-base-200/50 hover:bg-base-200 text-gray-400 text-sm px-4 py-1 rounded-2xl mb-2" onClick={() => setOpenDescription("")}>閉じる</button>
                            </div>
                        </>)}
                    </div>}
                </div>
            ))}
        </div>)
}

export { SettingAgents }