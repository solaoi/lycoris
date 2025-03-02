import { clipboard, invoke } from "@tauri-apps/api";
import { useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { toast } from "react-toastify";

import DB from "../../lib/sqlite";
import { showExecutedToolsState } from "../../store/atoms/showExecutedToolsState";
import { ArrowPath } from "../atoms/ArrowPath";
import { Check } from "../atoms/Check";
import { CheckBadge } from "../atoms/CheckBadge";
import { ChevronDown } from "../atoms/ChevronDown";
import { ChevronRight } from "../atoms/ChevronRight";
import { DocumentDuplicate } from "../atoms/DocumentDuplicate";
import { InformationCircle } from "../atoms/InformationCircle";
import { MyMarkdown } from "./MyMarkdown";

type ToolCardProps = {
    id: number,
    tool_results: string,
    note_id: number | undefined,
    note_title: string,
    clear: (id: number) => void,
    updateToolResults: (id: number, results: string) => void
}

const ToolCard = ({ id, tool_results, note_id, note_title, clear, updateToolResults }: ToolCardProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [dialogName, setDialogName] = useState<string>("");
    const [dialogMethod, setDialogMethod] = useState<string>("");
    const [dialogDescription, setDialogDescription] = useState<string>("");
    const [showExecuted, setShowExecuted] = useRecoilState(showExecutedToolsState);
    const obj = (() => {
        try {
            return JSON.parse(tool_results) as { "is_required_user_permission": boolean, "content": string | null, "cmds": { "call_id": string, "args": Object, "name": string, "method": string, "description": string, "result": string | null }[] }
        } catch (e) {
            return null;
        }
    })();
    if (obj === null) {
        return <div>ツールの呼び出しに失敗しました。</div>
    }
    const { is_required_user_permission, content, cmds } = obj;
    const [isExecuted, setIsExecuted] = useState(false);
    const executedTools = cmds.filter(cmd => cmd.result != null).length;
    const hasExecutedTools = executedTools > 0;

    return (
        <div className="tool-card w-full">
            {is_required_user_permission ?
                <div>
                    <MyMarkdown content={content || ""} title={`${note_title.trim()}_action-start_${id}`} />
                    <div className="mt-2">
                        {cmds.filter(cmd => cmd.result == null).map(({ call_id, args, name, method, description }) => {
                            return (
                                <div key={call_id} className="cursor-default h-full py-3 px-6 border border-neutral-300 rounded-md shadow">
                                    <h3 className="flex items-center justify-between text-xl font-semibold text-neutral-700 border-b pb-2">
                                        {name}
                                        <div className="cursor-pointer group relative"
                                            onClick={() => {
                                                setDialogName(name);
                                                setDialogMethod(method);
                                                setDialogDescription(description);
                                                dialogRef.current?.showModal();
                                            }}>
                                            <InformationCircle />
                                            <div className="w-12 invisible rounded text-xs
                                            font-bold text-white bg-slate-600 top-[-1.5rem] left-[-0.75rem] py-1 pl-[0.8rem]
                                            group-hover:visible absolute">詳細
                                            </div>
                                        </div>
                                    </h3>

                                    <div className="space-y-3 mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-neutral-500">メソッド名</span>
                                            <span className="font-medium text-neutral-700">{method}</span>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="text-xs text-neutral-500">引数</span>
                                            <code className="mt-1 p-2 bg-neutral-50 rounded text-sm font-mono text-neutral-700" style={{ overflowWrap: "anywhere" }}>
                                                {JSON.stringify(args, null, 2)}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div>
                        {hasExecutedTools &&
                            <button className="mt-4 mb-2 cursor-pointer flex items-center"
                                onClick={() => setShowExecuted(!showExecuted)}>
                                {showExecuted ?
                                    <ChevronDown /> :
                                    <ChevronRight />
                                }
                                <span>実行済みのツール（{executedTools}）</span>
                            </button>}
                        {showExecuted && (
                            cmds.filter(cmd => cmd.result !== null).reverse().map(({ call_id, args, name, method, description, result }) => {
                                return (
                                    <div key={call_id} className="cursor-default h-full py-3 px-6 border border-neutral-300 rounded-md shadow mb-2">
                                        <h3 className="flex items-center justify-between text-xl font-semibold text-neutral-700 border-b pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-primary">
                                                    <CheckBadge />
                                                </div>
                                                {name}
                                            </div>
                                            <div className="cursor-pointer group relative"
                                                onClick={() => {
                                                    setDialogName(name);
                                                    setDialogMethod(method);
                                                    setDialogDescription(description);
                                                    dialogRef.current?.showModal();
                                                }}>
                                                <InformationCircle />
                                                <div className="w-12 invisible rounded text-xs
                                                    font-bold text-white bg-slate-600 top-[-1.5rem] left-[-0.75rem] py-1 pl-[0.8rem]
                                                    group-hover:visible absolute">詳細
                                                </div>
                                            </div>
                                        </h3>

                                        <div className="space-y-3 mt-2">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-neutral-500">メソッド名</span>
                                                <span className="font-medium text-neutral-700">{method}</span>
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="text-xs text-neutral-500">引数</span>
                                                <code className="mt-1 p-2 bg-neutral-50 rounded text-sm font-mono text-neutral-700" style={{ overflowWrap: "anywhere" }}>
                                                    {JSON.stringify(args, null, 2)}
                                                </code>
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="text-xs text-neutral-500">実行結果</span>
                                                <code className="mt-1 p-2 bg-base-200 rounded text-sm font-mono text-neutral-700" style={{ overflowWrap: "anywhere" }}>{result}</code>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div> :
                <div>
                    <MyMarkdown content={content || ""} title={`${note_title.trim()}_action-end_${id}`} />
                    <div>
                        {hasExecutedTools &&
                            <button className="mt-4 mb-2 cursor-pointer flex items-center"
                                onClick={() => setShowExecuted(!showExecuted)}>
                                {showExecuted ?
                                    <ChevronDown /> :
                                    <ChevronRight />
                                }
                                <span>実行済みのツール（{executedTools}）</span>
                            </button>}
                        {showExecuted && (
                            cmds.filter(cmd => cmd.result !== null).reverse().map(({ call_id, args, name, method, description, result }) => {
                                return (
                                    <div key={call_id} className="cursor-default h-full py-3 px-6 border border-neutral-300 rounded-md shadow mb-2">
                                        <h3 className="flex items-center justify-between text-xl font-semibold text-neutral-700 border-b pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-primary">
                                                    <CheckBadge />
                                                </div>
                                                {name}
                                            </div>
                                            <div className="cursor-pointer group relative"
                                                onClick={() => {
                                                    setDialogName(name);
                                                    setDialogMethod(method);
                                                    setDialogDescription(description);
                                                    dialogRef.current?.showModal();
                                                }}>
                                                <InformationCircle />
                                                <div className="w-12 invisible rounded text-xs
                                                    font-bold text-white bg-slate-600 top-[-1.5rem] left-[-0.75rem] py-1 pl-[0.8rem]
                                                    group-hover:visible absolute">詳細
                                                </div>
                                            </div>
                                        </h3>

                                        <div className="space-y-3 mt-2">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-neutral-500">メソッド名</span>
                                                <span className="font-medium text-neutral-700">{method}</span>
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="text-xs text-neutral-500">引数</span>
                                                <code className="mt-1 p-2 bg-neutral-50 rounded text-sm font-mono text-neutral-700" style={{ overflowWrap: "anywhere" }}>
                                                    {JSON.stringify(args, null, 2)}
                                                </code>
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="text-xs text-neutral-500">実行結果</span>
                                                <code className="mt-1 p-2 bg-base-200 rounded text-sm font-mono text-neutral-700" style={{ overflowWrap: "anywhere" }}>{result}</code>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            }
            <div className='flex gap-2 absolute left-[16px] bottom-[-1.2rem] bg-white border-2 border-gray-200/60 rounded-2xl px-5 py-[4px] text-gray-400 text-sm'>
                {is_required_user_permission ?
                    <button className={'flex items-center text-primary hover:text-primary-focus' + (isExecuted ? " opacity-50" : "")} disabled={isExecuted} onClick={async () => {
                        toast.success("ツールを実行しました");
                        setIsExecuted(true);

                        try {
                            const result = await invoke('execute_mcp_tool_feature_command', { speechId: id });
                            updateToolResults(id, JSON.stringify(result));
                        } catch (error) {
                            console.error("ツール実行エラー:", error);
                            toast.error("ツールの実行に失敗しました");
                        } finally {
                            setIsExecuted(false);
                        }
                    }}>
                        <Check />
                        <p className='ml-[2px]'>実行</p>
                    </button> :
                    <button className='flex items-center hover:text-gray-500' onClick={() => { if (content) { clipboard.writeText(content); toast.success("コピーしました") } }}>
                        <DocumentDuplicate />
                        <p className='ml-[2px]'>コピー</p>
                    </button>
                }
                <button className='flex items-center hover:text-gray-500' onClick={async () => {
                    toast.success("リトライしました");
                    await DB.getInstance().then(db => db.resetAction(id));
                    clear(id);
                    invoke('execute_action_command', { noteId: note_id });
                }}>
                    <ArrowPath />
                    <p className='ml-[2px]'>リトライ</p>
                </button>
            </div>
            <dialog
                ref={dialogRef}
                className="modal cursor-default"
                onClick={e => {
                    e.stopPropagation();
                    if (e.target === dialogRef.current) {
                        dialogRef.current?.close();
                    }
                }}
            >
                <div className="modal-box">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <InformationCircle />
                        ツールの詳細
                    </h3>
                    <p className="py-4">{dialogDescription}</p>
                    <div className="flex justify-end text-sm">
                        <div className="badge bg-base-300 text-gray-500 mr-1">{dialogName}</div>
                        <div className="badge bg-base-300 text-gray-500">{dialogMethod}</div>
                    </div>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn">OK</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    )
}

export { ToolCard }
