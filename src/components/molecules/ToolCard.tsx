import { invoke } from "@tauri-apps/api/core"
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { githubLightTheme, JsonEditor } from 'json-edit-react'

import DB from "../../lib/sqlite";
import { ArrowPath } from "../atoms/ArrowPath";
import { Check } from "../atoms/Check";
import { CheckBadge } from "../atoms/CheckBadge";
import { ChevronDown } from "../atoms/ChevronDown";
import { ChevronRight } from "../atoms/ChevronRight";
import { DocumentDuplicate } from "../atoms/DocumentDuplicate";
import { InformationCircle } from "../atoms/InformationCircle";
import { MyMarkdown } from "./MyMarkdown";
import { Tool } from "../../type/Tool.type";
import { useRecoilState, useRecoilValue } from "recoil";
import { prevMethodsState } from "../../store/atoms/prevMethodsState";
import { settingAutoApproveLimitState } from "../../store/atoms/settingAutoApproveLimitState";
import { Variable } from "../atoms/Variable";
import { settingKeyState } from "../../store/atoms/settingKeyState";
import { GlobalOrt } from "../atoms/GlobalOrt";
import { Pencil } from "../atoms/Pencil";
import { ChatBubbleStartLogo } from "../atoms/ChatBubbleStartLogo";
import clipboard from "tauri-plugin-clipboard-api";

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
    const [showExecutedTool, setShowExecutedTool] = useState(false);
    const [prevMethods, setPrevMethods] = useRecoilState(prevMethodsState);
    const settingKeyOpenai = useRecoilValue(settingKeyState("settingKeyOpenai"));
    const isOpenaiKeySet = settingKeyOpenai !== "";

    useEffect(() => {
        setShowExecutedTool(false);
    }, [id]);
    type Cmd = { "call_id": string, "args": Object, "name": string, "method": string, "description": string, "result": string | null }
    const obj = (() => {
        try {
            return JSON.parse(tool_results) as { "is_required_user_permission": boolean, "content": string | null, "cmds": Cmd[] }
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

    const dialogArgsRef = useRef<HTMLDialogElement>(null);

    const autoApproveLimit = useRecoilValue(settingAutoApproveLimitState);
    const REQUIRED_REPEATS = 3;
    const MAX_HISTORY = autoApproveLimit > 0 ? autoApproveLimit : REQUIRED_REPEATS;
    const disabledAutoApproveLimit = autoApproveLimit === 0;

    const intersectionAll = (arrays: string[][]): string[] => {
        if (arrays.length === 0) return [];
        return arrays.reduce((acc, arr) => acc.filter((item) => arr.includes(item)));
    };

    const updateCmdContent = async (value: string, call_id: string, type: "args" | "result", isEnter: boolean = false) => {
        try {
            const updatedCmds = obj.cmds.map(cmd => {
                if (cmd.call_id === call_id) {
                    if (type === "args") {
                        const updatedArgs = JSON.parse(value);
                        return { ...cmd, args: updatedArgs };
                    } else {
                        const updatedResult = [{ "type": "text", "text": value }];
                        return { ...cmd, result: JSON.stringify(updatedResult) };
                    }
                }
                return cmd;
            });
            const content_2 = JSON.stringify({
                ...obj,
                cmds: updatedCmds
            });
            setIsExecuted(true);
            if (type === "args") {
                await invoke("update_content_2_on_speech_command", {
                    speechId: id,
                    content2: content_2
                }).then(() => {
                    updateToolResults(id, content_2);
                }).finally(() => {
                    setIsExecuted(false);
                });
            } else {
                await invoke("update_content_2_on_speech_command", {
                    speechId: id,
                    content2: content_2
                }).then(
                    async () => {
                        if (isEnter) {
                            await manualExecute();
                        }
                    }
                ).finally(() => {
                    setIsExecuted(false);
                });
            }
        } catch (error) {
            console.error("引数の更新に失敗しました:", error);
            toast.error("不正なJSON形式です", {
                pauseOnFocusLoss: false,
                autoClose: 2500
            });
        }
    }

    const manualExecute = async () => {
        toast.success("ツールを手動実行しました", {
            pauseOnFocusLoss: false,
            autoClose: 2500
        });
        setIsExecuted(true);
        setPrevMethods([]);

        try {
            const result = await invoke('execute_mcp_tool_feature_command', { speechId: id });
            updateToolResults(id, JSON.stringify(result));
        } catch (error) {
            console.error("ツール実行エラー:", error);
            toast.error("ツールの手動実行に失敗しました", {
                pauseOnFocusLoss: false,
                autoClose: 2500
            });
        } finally {
            setIsExecuted(false);
        }
    }

    useEffect(() => {
        let ignore = false;
        if (!isOpenaiKeySet) return;
        if (!is_required_user_permission) return;

        invoke("get_mcp_tools_command").then(async (arr) => {
            if (ignore) return;
            const tools = arr as Tool[];
            const toolNames = tools.map((tool) => tool.name);
            const cmdsToExecute = cmds.filter((cmd) => cmd.result == null);
            const isSearchWebWithOpenai = (name: string, method: string) => name === "system" && method === "search_web_with_openai";
            const getMethodKey = (cmd: Cmd) => `${cmd.name}_${cmd.method}`;

            const canExecute = cmdsToExecute.filter((cmd) => !isSearchWebWithOpenai(cmd.name, cmd.method))
                .every((cmd) =>
                    toolNames.includes(cmd.name)
                    && tools.find((tool) => tool.name === cmd.name)?.auto_approve.includes(cmd.method)
                );

            const cmdsRequiredAiAutoApprove = (() => {
                if (canExecute) return [];

                const hasNonAiApproveCmd = cmdsToExecute.some(cmd => {
                    if (isSearchWebWithOpenai(cmd.name, cmd.method)) return false;

                    const tool = tools.find((tool) => tool.name === cmd.name);
                    return tool && tool.ai_auto_approve === 0 &&
                        !tool.auto_approve.includes(cmd.method);
                });
                if (hasNonAiApproveCmd) return [];

                return cmdsToExecute.reduce((a, c) => {
                    const tool = tools.find((tool) => tool.name === c.name);
                    if (!tool) return a;
                    if (tool.auto_approve.includes(c.method)) {
                        return a;
                    }

                    return tool.ai_auto_approve ? [...a, c] : a;
                }, [] as Cmd[]);
            })();

            const aiAutoApprove = await (async () => {
                if (cmdsRequiredAiAutoApprove.length === 0) return false;

                return await invoke("check_approve_cmds_command", {
                    noteId: note_id!,
                    speechId: id,
                    cmds: cmdsRequiredAiAutoApprove.map((cmd) => ({
                        name: cmd.name,
                        method: cmd.method,
                        args: JSON.stringify(cmd.args),
                        description: cmd.description,
                        instruction: tools.find((tool) => tool.name === cmd.name)?.instruction || ""
                    }))
                }).then(
                    (result) => {
                        const res = result as { is_approved: boolean, reason: string }
                        if (res.is_approved) {
                            toast.success("Lycorisにより自動承認されました。", {
                                pauseOnFocusLoss: false,
                                autoClose: 500
                            });
                        } else {
                            toast.warning("Lycorisにより自動承認が却下されました。手動実行に切り替えます。", {
                                pauseOnFocusLoss: false,
                                autoClose: 3000
                            });
                        }
                        return res.is_approved;
                    }
                ).catch(
                    (err) => {
                        console.error(`AI自動承認エラー (${JSON.stringify(cmdsRequiredAiAutoApprove)}):`, err);
                        return false;
                    }
                );
            })();

            if (cmdsToExecute.length > 0 && (canExecute || aiAutoApprove)) {
                const currentMethods = cmdsToExecute.map(
                    (cmd) => getMethodKey(cmd)
                );

                const updatedMethods = [...prevMethods];
                if (updatedMethods.length >= MAX_HISTORY) {
                    updatedMethods.shift();
                }
                updatedMethods.push(currentMethods);
                setPrevMethods(updatedMethods);

                if (updatedMethods.length >= REQUIRED_REPEATS) {
                    const recentArrays = updatedMethods.slice(-REQUIRED_REPEATS);
                    const repeatedMethods = intersectionAll(recentArrays);

                    if (repeatedMethods.length > 0) {
                        const uniqueRepeated = [...new Set(repeatedMethods)];

                        uniqueRepeated.forEach((methodKey) => {
                            const found = cmdsToExecute.find(
                                (cmd) => getMethodKey(cmd) === methodKey
                            );
                            if (!found) return;

                            toast.warning(
                                <div className="w-full">
                                    <p className="mb-4">
                                        同じツールが {REQUIRED_REPEATS} ターン連続で実行されようとしています。手動実行に切り替えます。
                                    </p>
                                    <div className="flex justify-end text-sm flex-wrap gap-1">
                                        {found.name === "system" ? (found.method === "search_web_with_openai" ?
                                            <div className="badge bg-base-300 text-gray-500">
                                                WEB検索
                                            </div> : <div className="badge bg-base-300 text-gray-500">
                                                アンケート
                                            </div>) :
                                            <>
                                                <div className="badge bg-base-300 text-gray-500">
                                                    {found.name}
                                                </div>
                                                <div className="badge bg-base-300 text-gray-500">
                                                    {found.method}
                                                </div>
                                            </>
                                        }
                                    </div>
                                </div>,
                                {
                                    pauseOnFocusLoss: false,
                                    autoClose: 3000,
                                }
                            );
                        });
                        return;
                    }
                }

                if (!disabledAutoApproveLimit && updatedMethods.length >= MAX_HISTORY) {
                    toast.warning(
                        `ツールの自動承認回数が ${MAX_HISTORY} 回に達しました。手動実行に切り替えます。`,
                        {
                            pauseOnFocusLoss: false,
                            autoClose: 3000,
                        }
                    );
                    return;
                }

                const uniqueCurrentMethods = [...new Set(currentMethods)];
                const sameMethodsObj = uniqueCurrentMethods
                    .map((method) => {
                        const tmp = cmdsToExecute.find(
                            (cmd) => getMethodKey(cmd) === method
                        );
                        return tmp ? { name: tmp.name, method: tmp.method } : null;
                    })
                    .filter((v) => v !== null);

                sameMethodsObj.forEach((method) => {
                    toast.success(
                        <div className="w-full">
                            <p className="mb-4">ツールを自動実行しました</p>
                            <div className="flex justify-end text-sm flex-wrap gap-1">
                                {method.name === "system" ? (method.method === "search_web_with_openai" ?
                                    <div className="badge bg-base-300 text-gray-500">
                                        WEB検索
                                    </div> : <div className="badge bg-base-300 text-gray-500">
                                        アンケート
                                    </div>) :
                                    <>
                                        <div className="badge bg-base-300 text-gray-500">
                                            {method.name}
                                        </div>
                                        <div className="badge bg-base-300 text-gray-500">
                                            {method.method}
                                        </div>
                                    </>
                                }
                            </div>
                        </div>,
                        {
                            pauseOnFocusLoss: false,
                            autoClose: 2500,
                        }
                    );
                });

                setIsExecuted(true);
                try {
                    const result = await invoke("execute_mcp_tool_feature_command", {
                        speechId: id,
                    });
                    updateToolResults(id, JSON.stringify(result));
                } catch (error) {
                    console.error("ツール自動実行エラー:", error);
                    sameMethodsObj.forEach((method) => {
                        toast.error(
                            <div className="w-full">
                                <p className="mb-4">ツールの自動実行に失敗しました</p>
                                <div className="flex justify-end text-sm flex-wrap gap-1">
                                    {method.name === "system" ? (method.method === "search_web_with_openai" ?
                                        <div className="badge bg-base-300 text-gray-500">
                                            WEB検索
                                        </div> : <div className="badge bg-base-300 text-gray-500">
                                            アンケート
                                        </div>) :
                                        <>
                                            <div className="badge bg-base-300 text-gray-500">
                                                {method.name}
                                            </div>
                                            <div className="badge bg-base-300 text-gray-500">
                                                {method.method}
                                            </div>
                                        </>
                                    }
                                </div>
                            </div>,
                            {
                                pauseOnFocusLoss: false,
                                autoClose: 2500,
                            }
                        );
                    });
                } finally {
                    setIsExecuted(false);
                }
            }
        });

        return () => {
            ignore = true;
        };
    }, [tool_results]);

    return (
        <div className="tool-card w-full">
            {is_required_user_permission ?
                <div>
                    <MyMarkdown content={content || ""} title={`${note_title.trim()}_action-start_${id}`} />
                    <div className="mt-2">
                        {cmds.filter(cmd => cmd.result == null).map(({ call_id, args, name, method, description }) => {
                            return (
                                name === "system" ? (method === "get_user_response" ?
                                    <div key={call_id} className="cursor-default h-full py-3 px-6 border border-neutral-300 rounded-md shadow mb-2">
                                        <h3 className="flex items-center justify-between text-xl font-semibold text-neutral-700 border-b pb-2">
                                            <div className="flex items-center gap-2">
                                                <Pencil />
                                                アンケート
                                            </div>
                                        </h3>
                                        <div className="space-y-3 mt-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-neutral-500 select-text cursor-text">{
                                                    (args as { question: string }).question || ""
                                                }
                                                </span>
                                                <textarea className="mt-1 p-2 bg-white rounded border-2 border-base-300" autoFocus rows={3}
                                                    style={{ overflowWrap: "anywhere" }}
                                                    disabled={isExecuted || !isOpenaiKeySet}
                                                    onBlur={async (e) => {
                                                        await updateCmdContent(e.target.value, call_id, "result", e.currentTarget.dataset.enter === "true");
                                                    }}
                                                    onKeyDown={async (e) => {
                                                        if (!(e.shiftKey && e.key === 'Enter')) {
                                                            return
                                                        }
                                                        e.currentTarget.dataset.enter = "true";
                                                        e.currentTarget.blur();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div> : <div key={call_id} className="cursor-default h-full py-3 px-6 border border-neutral-300 rounded-md shadow mb-2">
                                        <h3 className="flex items-center justify-between text-xl font-semibold text-neutral-700 border-b pb-2">
                                            <div className="flex items-center gap-2">
                                                <GlobalOrt />
                                                WEB検索
                                            </div>
                                        </h3>
                                        <div className="space-y-2 flex items-end gap-1">
                                            <ChatBubbleStartLogo />
                                            <div className="chat !chat-start pb-3">
                                                <div className="chat-bubble text-sm text-neutral-500 select-text cursor-text bg-base-200" style={{ borderBottomRightRadius: "var(--rounded-box, 1rem)" }}>
                                                    <p>{(args as { question: string }).question || ""}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>) :
                                    <div key={call_id} className="cursor-default h-full py-3 px-6 border border-neutral-300 rounded-md shadow mb-2">
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
                                                <dialog
                                                    ref={dialogArgsRef}
                                                    className="modal cursor-default"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        if (e.target === dialogArgsRef.current) {
                                                            dialogArgsRef.current?.close();
                                                        }
                                                    }}
                                                >
                                                    <div className="modal-box h-1/2 flex flex-col">
                                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                                            <Variable />
                                                            引数の編集
                                                        </h3>
                                                        <div className="overflow-x-auto bg-white rounded mt-4">
                                                            <JsonEditor
                                                                data={args}
                                                                setData={async (data) => {
                                                                    await updateCmdContent(JSON.stringify(data), call_id, "args");
                                                                }}
                                                                theme={githubLightTheme}
                                                                enableClipboard={false}
                                                                rootFontSize={14}
                                                            />
                                                        </div>
                                                        <div className="modal-action">
                                                            <form method="dialog">
                                                                <button className="btn">OK</button>
                                                            </form>
                                                        </div>
                                                    </div>
                                                </dialog>
                                                <code className="mt-1 p-2 bg-neutral-50 rounded text-sm font-mono text-neutral-700 cursor-pointer hover:border-base-300 border-2 border-transparent max-h-[200px] overflow-y-auto"
                                                    style={{ overflowWrap: "anywhere", ...(isExecuted ? { cursor: "not-allowed" } : {}) }}
                                                    onDoubleClick={(e) => { e.preventDefault(); if (!isExecuted) { dialogArgsRef.current?.showModal(); } }}>
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
                                onClick={() => setShowExecutedTool(!showExecutedTool)}>
                                {showExecutedTool ?
                                    <ChevronDown /> :
                                    <ChevronRight />
                                }
                                <span>実行済みのツール（{executedTools}）</span>
                            </button>}
                        {showExecutedTool && (
                            cmds.filter(cmd => cmd.result !== null).reverse().map(({ call_id, args, name, method, description, result }) => {
                                return (
                                    name === "system" ? (method === "get_user_response" ?
                                        <div key={call_id} className="cursor-default h-full py-3 px-6 border border-neutral-300 rounded-md shadow mb-2">
                                            <h3 className="flex items-center justify-between text-xl font-semibold text-neutral-700 border-b pb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-primary">
                                                        <CheckBadge />
                                                    </div>
                                                    アンケート
                                                </div>
                                            </h3>
                                            <div className="space-y-3 mt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-neutral-500">{
                                                        (args as { question: string }).question || ""
                                                    }
                                                    </span>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-xs text-neutral-500">入力内容</span>
                                                    <code className="mt-1 p-2 bg-base-200 rounded text-sm font-mono text-neutral-700 max-h-[200px] overflow-y-auto" style={{ overflowWrap: "anywhere" }}>{result && JSON.parse(result)[0]?.text || "無回答"}</code>
                                                </div>
                                            </div>
                                        </div> :
                                        <div key={call_id} className="cursor-default h-full py-3 px-6 border border-neutral-300 rounded-md shadow mb-2">
                                            <h3 className="flex items-center justify-between text-xl font-semibold text-neutral-700 border-b pb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-primary">
                                                        <CheckBadge />
                                                    </div>
                                                    WEB検索
                                                </div>
                                            </h3>
                                            <div className="space-y-2 flex items-end gap-1">
                                                <ChatBubbleStartLogo />
                                                <div className="chat !chat-start pb-3">
                                                    <div className="chat-bubble text-sm text-neutral-500 select-text cursor-text bg-base-200" style={{ borderBottomRightRadius: "var(--rounded-box, 1rem)" }}>
                                                        <p>{(args as { question: string }).question || ""}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col mt-6">
                                                <span className="text-xs text-neutral-500">検索結果</span>
                                                <code className="mt-1 p-2 bg-base-200 rounded text-sm font-mono text-neutral-700 select-text cursor-text max-h-[200px] overflow-y-auto" style={{ overflowWrap: "anywhere" }}>{result || "検索クエリが抽出できませんでした。"}</code>
                                            </div>
                                        </div>
                                    ) :
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
                                                    <code className="mt-1 p-2 bg-neutral-50 rounded text-sm font-mono text-neutral-700 max-h-[200px] overflow-y-auto" style={{ overflowWrap: "anywhere" }}>
                                                        {JSON.stringify(args, null, 2)}
                                                    </code>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-xs text-neutral-500">実行結果</span>
                                                    <code className="mt-1 p-2 bg-base-200 rounded text-sm font-mono text-neutral-700 max-h-[200px] overflow-y-auto" style={{ overflowWrap: "anywhere" }}>{result}</code>
                                                </div>
                                            </div>
                                        </div>
                                )
                            })
                        )}
                        {showExecutedTool && (
                            <div className="flex justify-center">
                                <button className="bg-base-200/50 hover:bg-base-200 text-gray-400 text-sm px-4 py-1 rounded-2xl" onClick={() => setShowExecutedTool(false)}>閉じる</button>
                            </div>
                        )}
                    </div>
                </div> :
                <div>
                    <MyMarkdown content={content || ""} title={`${note_title.trim()}_action-end_${id}`} />
                    <div>
                        {hasExecutedTools &&
                            <button className="mt-4 mb-2 cursor-pointer flex items-center"
                                onClick={() => setShowExecutedTool(!showExecutedTool)}>
                                {showExecutedTool ?
                                    <ChevronDown /> :
                                    <ChevronRight />
                                }
                                <span>実行済みのツール（{executedTools}）</span>
                            </button>}
                        {showExecutedTool && (
                            cmds.filter(cmd => cmd.result !== null).reverse().map(({ call_id, args, name, method, description, result }) => {
                                return (
                                    name === "system" ? (method === "get_user_response" ?
                                        <div key={call_id} className="cursor-default h-full py-3 px-6 border border-neutral-300 rounded-md shadow mb-2">
                                            <h3 className="flex items-center justify-between text-xl font-semibold text-neutral-700 border-b pb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-primary">
                                                        <CheckBadge />
                                                    </div>
                                                    アンケート
                                                </div>
                                            </h3>
                                            <div className="space-y-3 mt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-neutral-500">{
                                                        (args as { question: string }).question || ""
                                                    }
                                                    </span>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-xs text-neutral-500">入力内容</span>
                                                    <code className="mt-1 p-2 bg-base-200 rounded text-sm font-mono text-neutral-700 max-h-[200px] overflow-y-auto" style={{ overflowWrap: "anywhere" }}>{result && JSON.parse(result)[0]?.text || "無回答"}</code>
                                                </div>
                                            </div>
                                        </div> : <div key={call_id} className="cursor-default h-full py-3 px-6 border border-neutral-300 rounded-md shadow mb-2">
                                            <h3 className="flex items-center justify-between text-xl font-semibold text-neutral-700 border-b pb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-primary">
                                                        <CheckBadge />
                                                    </div>
                                                    WEB検索
                                                </div>
                                            </h3>
                                            <div className="space-y-2 flex items-end gap-1">
                                                <ChatBubbleStartLogo />
                                                <div className="chat !chat-start pb-3">
                                                    <div className="chat-bubble text-sm text-neutral-500 bg-base-200" style={{ borderBottomRightRadius: "var(--rounded-box, 1rem)" }}>
                                                        <p>{(args as { question: string }).question || ""}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col mt-6">
                                                <span className="text-xs text-neutral-500">検索結果</span>
                                                <code className="mt-1 p-2 bg-base-200 rounded text-sm font-mono text-neutral-700 select-text cursor-text max-h-[200px] overflow-y-auto" style={{ overflowWrap: "anywhere" }}>{result || "検索クエリが抽出できませんでした。"}</code>
                                            </div>
                                        </div>) :
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
                                                    <code className="mt-1 p-2 bg-neutral-50 rounded text-sm font-mono text-neutral-700 max-h-[200px] overflow-y-auto" style={{ overflowWrap: "anywhere" }}>
                                                        {JSON.stringify(args, null, 2)}
                                                    </code>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-xs text-neutral-500">実行結果</span>
                                                    <code className="mt-1 p-2 bg-base-200 rounded text-sm font-mono text-neutral-700 max-h-[200px] overflow-y-auto" style={{ overflowWrap: "anywhere" }}>{result}</code>
                                                </div>
                                            </div>
                                        </div>
                                )
                            })
                        )}
                        {showExecutedTool && (
                            <div className="flex justify-center">
                                <button className="bg-base-200/50 hover:bg-base-200 text-gray-400 text-sm px-4 py-1 rounded-2xl" onClick={() => setShowExecutedTool(false)}>閉じる</button>
                            </div>
                        )}
                    </div>
                </div>
            }
            <div className='flex gap-2 absolute left-[16px] bottom-[-1.2rem] bg-white border-2 border-gray-200/60 rounded-2xl px-5 py-[4px] text-gray-400 text-sm'>
                {is_required_user_permission ?
                    <button className={'flex items-center text-primary hover:text-primary-focus' + (isExecuted || !isOpenaiKeySet || cmds.filter(cmd => cmd.result == null).length === 0 ? " opacity-50 !text-gray-400" : "")}
                        disabled={isExecuted || !isOpenaiKeySet}
                        onClick={manualExecute}>
                        <Check />
                        <p className='ml-[2px]'>実行</p>
                    </button> :
                    <button className='flex items-center hover:text-gray-500' onClick={() => {
                        if (content) {
                            clipboard.writeText(content);
                            toast.info("コピーしました", {
                                pauseOnFocusLoss: false,
                                autoClose: 2500
                            })
                        }
                    }}>
                        <DocumentDuplicate />
                        <p className='ml-[2px]'>コピー</p>
                    </button>
                }
                <button
                    className={'flex items-center hover:text-gray-500' + (isExecuted || !isOpenaiKeySet ? " opacity-50 !text-gray-400" : "")}
                    disabled={isExecuted || !isOpenaiKeySet}
                    onClick={async () => {
                        toast.success("リトライしました", {
                            pauseOnFocusLoss: false,
                            autoClose: 2500
                        });
                        await DB.getInstance().then(db => db.resetAction(id));
                        setPrevMethods([]);
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
