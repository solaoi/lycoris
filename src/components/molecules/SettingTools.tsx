import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "../atoms/ChevronRight";
import { ChevronDown } from "../atoms/ChevronDown";
import { invoke } from "@tauri-apps/api/core";
import { Tool } from "../../type/Tool.type";
import { MultiSelect, Option } from "./MultiSelect";

type SettingToolsProps = {
    disabled: boolean
    tools: Tool[]
    addSelectedServers: (serverName: string) => void
    deleteSelectedServers: (serverName: string) => void
    updateTool: (toolName: string, disabled: number, aiAutoApprove: number, instruction: string, autoApprove: string[]) => void
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

    const [optionSelected, setSelected] = useState<Option[] | null>();
    const handleChange = (selected: Option[]) => {
        setSelected(selected);
    };
    useEffect(() => {
        if (openDescription === "") { return; }
        const optionSelected = tools.find(tool => tool.name === openDescription)!.auto_approve.map(feature => ({ value: feature, label: feature }))
        setSelected(optionSelected)
    }, [openDescription])

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
                            <div style={tools.find(tool => tool.name === serverName)!.disabled === 0 ? {} : { color: "#9B9B9B", textDecoration: "line-through" }}>{serverName}</div>
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
                                        <div className="px-6 py-3 mb-2 border border-neutral-300 rounded-md">
                                            <div className="py-2 px-6 mb-2">
                                                <div className=" text-gray-600 mb-2">
                                                    <p className="font-bold mb-1">ツールの有効化</p>
                                                    <p className="text-sm">Lycorisがこのツールを呼び出すことができます。</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="font-bold text-gray-600 mr-2">
                                                        <label className="cursor-pointer label">
                                                            <span className="label-text inline-flex mr-2 w-20">
                                                                <p className="text-base-content/40">有効化</p>
                                                            </span>
                                                            <input type="checkbox"
                                                                className="toggle toggle-accent"
                                                                defaultChecked={tools.find(tool => tool.name === serverName)!.disabled === 0}
                                                                onChange={(e) => {
                                                                    const disabled = e.target.checked ? 0 : 1
                                                                    const aiAutoApprove = tools.find(tool => tool.name === serverName)!.ai_auto_approve
                                                                    const instruction = tools.find(tool => tool.name === serverName)!.instruction
                                                                    const autoApprove = tools.find(tool => tool.name === serverName)!.auto_approve
                                                                    invoke("update_tool_command", {
                                                                        toolName: serverName,
                                                                        disabled,
                                                                        aiAutoApprove,
                                                                        instruction,
                                                                        autoApprove
                                                                    }).then(() => {
                                                                        updateTool(serverName, disabled, aiAutoApprove, instruction, autoApprove)
                                                                    })
                                                                }
                                                                }
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="py-2 px-6">
                                                <div className=" text-gray-600 mb-2">
                                                    <p className="font-bold mb-1">詳細説明</p>
                                                    <p className="text-sm">Lycorisがこの説明を参照して、このツールを呼び出しやすくなります。</p>
                                                </div>
                                                <textarea
                                                    className="my-2 w-full p-3 border border-gray-300 rounded-md min-h-[100px]"
                                                    placeholder="サーバの機能、呼び出し方法、パラメータの説明などを入力してください..."
                                                    defaultValue={tools.find(tool => tool.name === serverName)!.instruction}
                                                    onBlur={(e) => {
                                                        const instruction = e.target.value
                                                        const disabled = tools.find(tool => tool.name === serverName)!.disabled
                                                        const aiAutoApprove = tools.find(tool => tool.name === serverName)!.ai_auto_approve
                                                        const autoApprove = tools.find(tool => tool.name === serverName)!.auto_approve
                                                        invoke("update_tool_command", {
                                                            toolName: serverName,
                                                            disabled,
                                                            aiAutoApprove,
                                                            instruction,
                                                            autoApprove
                                                        }).then(() => {
                                                            updateTool(serverName, disabled, aiAutoApprove, instruction, autoApprove)
                                                        })
                                                    }}
                                                />
                                            </div>
                                            <div className="py-2 px-6 mb-2">
                                                <div className=" text-gray-600 mb-2">
                                                    <p className="font-bold mb-1">Lycorisによる自動承認</p>
                                                    <p className="text-sm">各機能の自動承認が無効でも、低リスクであればLycorisが自動で承認します。</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="font-bold text-gray-600 mr-2">
                                                        <label className="cursor-pointer label">
                                                            <span className="label-text inline-flex mr-2 w-20">
                                                                <p className="text-base-content/40">自動承認</p>
                                                            </span>
                                                            <input type="checkbox"
                                                                className="toggle toggle-accent"
                                                                defaultChecked={tools.find(tool => tool.name === serverName)!.ai_auto_approve === 1}
                                                                onChange={(e) => {
                                                                    const aiAutoApprove = e.target.checked ? 1 : 0
                                                                    const disabled = tools.find(tool => tool.name === serverName)!.disabled
                                                                    const instruction = tools.find(tool => tool.name === serverName)!.instruction
                                                                    const autoApprove = tools.find(tool => tool.name === serverName)!.auto_approve
                                                                    invoke("update_tool_command", {
                                                                        toolName: serverName,
                                                                        disabled,
                                                                        aiAutoApprove,
                                                                        instruction,
                                                                        autoApprove
                                                                    }).then(() => {
                                                                        updateTool(serverName, disabled, aiAutoApprove, instruction, autoApprove)
                                                                    })
                                                                }
                                                                }
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="py-2 px-6 mb-2">
                                                <div className=" text-gray-600 mb-2">
                                                    <p className="font-bold mb-1">各機能の自動承認</p>
                                                    <p className="text-sm">選択した機能の自動承認を有効化します。</p>
                                                </div>
                                                <div className="my-2">
                                                    <MultiSelect
                                                        labelName="機能"
                                                        key={`${serverName}_features_${index}`}
                                                        options={toolDescriptions.map(desc => ({ value: desc.name, label: desc.name }))}
                                                        onChange={handleChange}
                                                        value={optionSelected}
                                                        isSelectAll={true}
                                                        menuPlacement={"bottom"}
                                                        onBlur={() => {
                                                            const instruction = tools.find(tool => tool.name === serverName)!.instruction
                                                            const disabled = tools.find(tool => tool.name === serverName)!.disabled
                                                            const aiAutoApprove = tools.find(tool => tool.name === serverName)!.ai_auto_approve
                                                            const autoApprove = optionSelected?.map(option => option.value) ?? []
                                                            invoke("update_tool_command", {
                                                                toolName: serverName,
                                                                disabled,
                                                                aiAutoApprove,
                                                                instruction,
                                                                autoApprove
                                                            }).then(() => {
                                                                updateTool(serverName, disabled, aiAutoApprove, instruction, autoApprove)
                                                            })
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-6 py-3 mb-4 border border-neutral-300 rounded-md">
                                            <div className="py-2 px-6 mb-2">
                                                <div className=" text-gray-600 mb-4">
                                                    <p className="font-bold mb-1">機能一覧</p>
                                                    <p className="text-sm">Lycorisが呼び出すことができる、このツールの機能一覧です。</p>
                                                </div>
                                                {toolDescriptions.map((t, index) => (
                                                    <div key={`${t.name}_${index}`} className="cursor-default py-3 px-6 mb-2 border border-neutral-300 rounded-md">
                                                        <div className="mb-2">{t.name}</div>
                                                        <div className="text-sm">
                                                            <p>{t.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
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