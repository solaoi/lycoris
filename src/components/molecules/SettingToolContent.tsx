import { useEffect, useState } from "react";
import { SettingToolAddButton } from "./SettingToolAddButton"
import { SettingTools } from "./SettingTools"
import { invoke } from "@tauri-apps/api/core";
import { useRecoilState } from "recoil";
import { disabledMCPSettingState } from "../../store/atoms/disabledMCPSettingState";
import { Tool } from "../../type/Tool.type";

const SettingToolContent = (): JSX.Element => {
    const [requireReload, setRequireReload] = useRecoilState(disabledMCPSettingState);
    const [tools, setTools] = useState<Tool[]>([]);
    useEffect(() => {
        invoke('get_mcp_tools_command').then((arr) => {
            const tools = arr as Tool[];
            setTools(tools);
        });
    }, [setTools]);
    const addTools = (tools: Tool[]) => {
        setTools(prev => [...prev, ...tools]);
    }
    const [selectedServers, setSelectedServers] = useState<string[]>([]);
    const addSelectedServers = (serverName: string) => {
        setSelectedServers(prev => [...prev, serverName]);
    };
    const deleteSelectedServers = (serverName: string) => {
        setSelectedServers(prev => prev.filter((selectedServer) => selectedServer !== serverName));
    }
    const updateTool = (toolName: string, disabled: number, aiAutoApprove: number, instruction: string, autoApprove: string[]) => {
        setTools(prev => prev.map(tool => tool.name === toolName ? { ...tool, disabled, ai_auto_approve: aiAutoApprove, instruction: instruction, auto_approve: autoApprove } : tool));
    }

    return (
        <div>
            <div className="flex items-center">
                <SettingToolAddButton setReload={() => setRequireReload(true)} tools={tools} addTools={addTools} />
                <div>
                    {selectedServers.length > 0 && (
                        <button
                            className="btn text-secondary ml-2 bg-base-100 border border-solid border-neutral-300"
                            onClick={async () => {
                                await invoke('delete_mcp_config_command', { toolNames: selectedServers })
                                    .then(async () => {
                                        setTools(prev => prev.filter((tool) => !selectedServers.includes(tool.name)));
                                        setSelectedServers([]);
                                        setRequireReload(true);
                                    });
                            }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                            </svg>
                            {selectedServers.length}個のサーバを削除
                        </button>
                    )}
                </div>
            </div>
            <div className="mt-4">
                <SettingTools disabled={requireReload} tools={tools} addSelectedServers={addSelectedServers} deleteSelectedServers={deleteSelectedServers} updateTool={updateTool} />
            </div>
        </div>
    )
}

export { SettingToolContent }