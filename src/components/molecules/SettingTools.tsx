import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "../atoms/ChevronRight";
import { ChevronDown } from "../atoms/ChevronDown";
import { invoke } from "@tauri-apps/api";
import { Tool } from "../../type/Tool.type";

type SettingToolsProps = {
    disabled: boolean
    tools: Tool[]
    addSelectedServers: (serverName: string) => void
    deleteSelectedServers: (serverName: string) => void
    updateTool: (toolName: string, autoApprove: number, instruction: string) => void
}

type ToolDescription = {
    name: string
    description: string
}

const SettingTools = (props: SettingToolsProps): JSX.Element => {
    const { disabled, tools, addSelectedServers, deleteSelectedServers, updateTool } = props
    const sortedServerNames = useMemo(() => [...tools.map(tool => tool.name)].sort(), [tools])
    const [openDescription, setOpenDescription] = useState("")
    const [toolDescriptions, setToolDescriptions] = useState<ToolDescription[]>([])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => {
        setOpenDescription("")
        setToolDescriptions([])
    }, [tools.length])

    return (
        <div>
            {disabled && (<div className="alert bg-secondary mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>変更を反映するには、Lycorisを再起動してください。</span>
            </div>)}
            {sortedServerNames.map((serverName, index) => (
                <div key={`${serverName}_${index}`}>
                    <div className="flex items-center">
                        <input type="checkbox" className="checkbox" onChange={(e) => {
                            if (e.target.checked) {
                                addSelectedServers(serverName)
                            } else {
                                deleteSelectedServers(serverName)
                            }
                        }} />
                        <div
                            className={"flex-1 flex items-center justify-between p-2 border-b border-gray-200 cursor-pointer hover:bg-base-200 rounded ml-2"
                                + (serverName === openDescription ? " bg-base-200" : "")
                            }
                            style={disabled ? { cursor: "not-allowed" } : {}}
                            onClick={() => {
                                if (disabled) { return; }
                                if (openDescription === serverName) {
                                    setOpenDescription("");
                                } else {
                                    setIsLoading(true);
                                    setOpenDescription(serverName);
                                    invoke("get_mcp_tool_features_command", { toolName: serverName })
                                        .then((toolDescriptions) => {
                                            setToolDescriptions(toolDescriptions as ToolDescription[])
                                        }).catch((e) => {
                                            console.error(e)
                                        }).finally(() => { setIsLoading(false) });
                                }
                            }}>
                            <div>{serverName}</div>
                            {serverName !== openDescription ? <ChevronRight /> : <ChevronDown />}
                        </div>
                    </div>
                    {serverName === openDescription && <div className="mt-2 ml-8">
                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <span className="loading loading-spinner loading-md"></span>
                            </div>
                        ) : (
                            (
                                toolDescriptions.length === 0 ? (
                                    <div className="py-3 px-6 mb-2 border border-neutral-300 rounded-md">
                                        <p>利用可能なツール情報がありません。</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="py-3 px-6 mb-2 border border-neutral-300 rounded-md">
                                            <div className="py-3 px-6">
                                                <div className=" text-gray-600 mb-2">
                                                    <p className="font-bold mb-2">自動承認</p>
                                                </div>
                                                <div className="flex items-center mt-2">
                                                    <div className="font-bold text-gray-600 mr-2">
                                                        <label className="cursor-pointer label">
                                                            <span className="label-text inline-flex mr-2">
                                                                <p className="text-base-content/40">有効化</p>
                                                            </span>
                                                            <input type="checkbox"
                                                                className="toggle toggle-accent"
                                                                defaultChecked={tools.find(tool => tool.name === serverName)?.auto_approve === 1}
                                                                onChange={(e) => {
                                                                    const autoApprove = e.target.checked ? 1 : 0
                                                                    const instruction = tools.find(tool => tool.name === serverName)?.instruction ?? ""
                                                                    invoke("update_tool_command", {
                                                                        toolName: serverName,
                                                                        autoApprove,
                                                                        instruction
                                                                    }).then(() => {
                                                                        updateTool(serverName, autoApprove, instruction)
                                                                    })
                                                                }
                                                                }
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="py-3 px-6">
                                                <div className=" text-gray-600 mb-2">
                                                    <p className="font-bold mb-2">詳細説明</p>
                                                    <p className="text-sm">AIがこの説明を参照して、サーバを呼び出しやすくなります。</p>
                                                </div>
                                                <textarea
                                                    className="w-full p-3 border border-gray-300 rounded-md min-h-[100px]"
                                                    placeholder="サーバの機能、呼び出し方法、パラメータの説明などを入力してください..."
                                                    defaultValue={tools.find(tool => tool.name === serverName)?.instruction ?? ""}
                                                    onBlur={(e) => {
                                                        const instruction = e.target.value
                                                        const autoApprove = tools.find(tool => tool.name === serverName)?.auto_approve ?? 0
                                                        invoke("update_tool_command", {
                                                            toolName: serverName,
                                                            autoApprove,
                                                            instruction
                                                        }).then(() => {
                                                            updateTool(serverName, autoApprove, instruction)
                                                        })
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        {toolDescriptions.map((t, index) => (
                                            <div key={`${t.name}_${index}`} className="cursor-default py-3 px-6 mb-2 border border-neutral-300 rounded-md">
                                                <div className="mb-2">{t.name}</div>
                                                <div className="text-sm">
                                                    <p>{t.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex justify-center">
                                            <button className="bg-base-200/50 hover:bg-base-200 text-gray-400 text-sm px-4 py-1 rounded-2xl mb-2" onClick={() => setOpenDescription("")}>閉じる</button>
                                        </div>
                                    </>
                                )
                            ))
                        }
                    </div>}
                </div>
            ))}
        </div>)
}

export { SettingTools }