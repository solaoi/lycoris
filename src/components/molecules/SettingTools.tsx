import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "../atoms/ChevronRight";
import { ChevronDown } from "../atoms/ChevronDown";
import { invoke } from "@tauri-apps/api";

type SettingToolsProps = {
    disabled: boolean
    serverNames: string[]
    addSelectedServers: (serverName: string) => void
    deleteSelectedServers: (serverName: string) => void
}

type ToolDescription = {
    name: string
    description: string
}

const SettingTools = (props: SettingToolsProps): JSX.Element => {
    const { disabled, serverNames, addSelectedServers, deleteSelectedServers } = props
    const sortedServerNames = useMemo(() => [...serverNames].sort(), [serverNames])
    const [openDescription, setOpenDescription] = useState("")
    const [toolDescriptions, setToolDescriptions] = useState<ToolDescription[]>([])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => {
        setOpenDescription("")
        setToolDescriptions([])
    }, [serverNames])

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
                                        {toolDescriptions.map((t, index) => (
                                            <div key={`${t.name}_${index}`} className="cursor-default py-3 px-6 mb-2 border border-neutral-300 rounded-md">
                                                <div className="mb-2">{t.name}</div>
                                                <div className="text-sm">
                                                    <p>{t.description}</p>
                                                </div>
                                            </div>
                                        ))}
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