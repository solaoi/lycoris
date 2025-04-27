import { invoke } from "@tauri-apps/api";
import { useRef, useState } from "react";
import { Agent } from "../../type/Agent.type";
import { toast } from "react-toastify";

type SettingAgentAddButtonProps = {
    addAgent: (agent: Agent) => void
}

const SettingAgentAddButton = (props: SettingAgentAddButtonProps): JSX.Element => {
    const { addAgent } = props;
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [name, setName] = useState("");
    const [rolePrompt, setRolePrompt] = useState("");
    const [mode, setMode] = useState(0);
    const [hasWorkspace, setHasWorkspace] = useState(0);
    const [toolList, setToolList] = useState("");

    return (
        <>
            <div className="flex items-center">
                <button
                    className="btn text-primary bg-base-100 border border-solid border-neutral-300"
                    onClick={(e) => {
                        e.stopPropagation();
                        dialogRef.current?.showModal();
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    エージェントを追加</button>
            </div>
            <dialog
                ref={dialogRef}
                className="modal cursor-default"
                onClick={e => {
                    e.stopPropagation();
                    if (e.target === dialogRef.current) {
                        setName("");
                        setRolePrompt("");
                        setMode(0);
                        setHasWorkspace(0);
                        setToolList("");
                        dialogRef.current?.close();
                    }
                }}
            >
                <div className="modal-box">
                    <h3 className="font-bold text-lg">エージェントの追加</h3>
                    <div className="flex flex-col">
                        <label className="label">
                            <span className="label-text">エージェント名</span>
                        </label>
                        <input
                            type="text"
                            placeholder=''
                            className="p-2.5 h-full rounded-2xl input input-bordered focus:outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <label className="label">
                            <span className="label-text">役割</span>
                        </label>
                        <textarea
                            rows={6}
                            placeholder=''
                            className="p-2.5 h-full rounded-2xl input input-bordered focus:outline-none"
                            value={rolePrompt}
                            onChange={(e) => setRolePrompt(e.target.value)}
                        />
                        <div className="flex flex-col gap-2 w-full mt-4">
                            <div className="flex">
                                <label className="label w-1/2">
                                    <span className="label-text">モード</span>
                                </label>
                                <select className="select select-bordered w-full max-w-xs"
                                    value={mode}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        if (hasWorkspace === 0 && value === 1) {
                                            toast.error("ワークスペースを無効にしている場合、返答しないモードは選択できません");
                                            return;
                                        }
                                        setMode(value)
                                    }}>
                                    <option value="0">発言ごとに返答</option>
                                    <option value="1">返答しない</option>
                                </select>
                            </div>
                            <div className="flex">
                                <label className="label w-1/2">
                                    <span className="label-text">ワークスペース</span>
                                </label>
                                <select className="select select-bordered w-full max-w-xs"
                                    value={hasWorkspace}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        if (mode === 1 && value === 0) {
                                            toast.error("返答しないモードではワークスペースを無効にできません");
                                            return;
                                        }
                                        setHasWorkspace(value)
                                    }}>
                                    <option value="0">無効</option>
                                    <option value="1">有効</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn mr-2" onClick={() => { setName(""); setRolePrompt(""); setMode(0); setHasWorkspace(0); setToolList(""); }}>キャンセル</button>
                            <button className="btn text-primary"
                                onClick={async () => {
                                    await invoke("insert_agent_command", { name: name, hasWorkspace: hasWorkspace, mode: mode, rolePrompt: rolePrompt, toolList: toolList })
                                        .then(async (value: unknown) => {
                                            const agent = value as { id: number, name: string, has_workspace: number, mode: number, role_prompt: string, tool_list: string };
                                            setName("");
                                            setRolePrompt("");
                                            setMode(0);
                                            setHasWorkspace(0);
                                            setToolList("");
                                            addAgent({ id: agent.id, name: agent.name, has_workspace: agent.has_workspace, mode: agent.mode, role_prompt: agent.role_prompt, tool_list: agent.tool_list.split(",") });
                                        }).catch((e) => {
                                            console.error(e.message);
                                        });
                                }}>追加</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    )
}

export { SettingAgentAddButton }
