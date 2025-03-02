import { invoke } from "@tauri-apps/api";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type SettingToolAddButtonProps = {
    serverNames: string[]
    addServerNames: (serverNames: string[]) => void
    setReload: () => void
}

const SettingToolAddButton = (props: SettingToolAddButtonProps): JSX.Element => {
    const { serverNames, addServerNames, setReload } = props;
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [content, setContent] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [isPassedTest, setIsPassedTest] = useState(false);
    useEffect(() => {
        setIsPassedTest(false);
    }, [content]);

    const validateMCPConfig = (data: unknown) => {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return { isValid: false, error: 'ルート要素はオブジェクトである必要があります' };
        }
        if (!('mcpServers' in data)) {
            return { isValid: false, error: '必須フィールド "mcpServers" が見つかりません' };
        }
        const { mcpServers } = data as { mcpServers: unknown };
        if (!mcpServers || typeof mcpServers !== 'object' || Array.isArray(mcpServers)) {
            return { isValid: false, error: '"mcpServers" はオブジェクトである必要があります' };
        }
        const serverEntries = Object.entries(mcpServers as Record<string, unknown>);
        if (serverEntries.length === 0) {
            return { isValid: false, error: '"mcpServers" には少なくとも1つのサーバ設定が必要です' };
        }
        for (const [serverName, config] of serverEntries) {
            if (serverName.trim() === '') {
                return {
                    isValid: false,
                    error: 'サーバー名は空文字列にできません'
                };
            }
            if (serverNames.includes(serverName)) {
                return {
                    isValid: false,
                    error: `"${serverName}" はすでに存在します`
                };
            }
            if (!config || typeof config !== 'object' || Array.isArray(config)) {
                return {
                    isValid: false,
                    error: `"${serverName}" の設定はオブジェクトである必要があります`
                };
            }
            if (!('command' in config)) {
                return {
                    isValid: false,
                    error: `"${serverName}" の必須フィールド "command" が見つかりません`
                };
            }
            if (typeof (config as { command: unknown }).command !== 'string') {
                return {
                    isValid: false,
                    error: `"${serverName}" の "command" フィールドは文字列である必要があります`
                };
            }
            if ((config as { command: string }).command.trim() === '') {
                return {
                    isValid: false,
                    error: `"${serverName}" の "command" フィールドは空文字列にできません`
                };
            }
        }

        return { isValid: true, error: null };
    }

    const handleConnectTestClick = async () => {
        try {
            setConnecting(true);
            const obj = JSON.parse(content);
            const { isValid, error } = validateMCPConfig(obj);
            if (!isValid) {
                toast.error(error);
                return;
            }
            const { mcpServers } = obj as { mcpServers: unknown };
            const serverEntries = Object.entries(mcpServers as Record<string, unknown>);
            const testPromises = Array.from(serverEntries).map(([_, config]) =>
                invoke('test_mcp_tool_command', { toolConnectTestRequest: config })
            );
            await Promise.all(testPromises)
                .then((results) => {
                    if (results.every((result) => result === true)) {
                        setIsPassedTest(true);
                        toast.success("接続テストに成功しました");
                    } else {
                        setIsPassedTest(false);
                        toast.error("接続テストに失敗しました");
                    }
                })
                .catch((e) => {
                    setIsPassedTest(false);
                    console.error(e);
                    toast.error("接続テストに失敗しました");
                });
        } catch (e) {
            toast.error("JSON形式が正しくありません");
            return;
        } finally {
            setConnecting(false);
        }
    }

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
                    サーバを追加</button>
            </div>
            <dialog
                ref={dialogRef}
                className="modal cursor-default"
                onClick={e => {
                    e.stopPropagation();
                    if (e.target === dialogRef.current) {
                        setContent(""); setConnecting(false);
                        dialogRef.current?.close();
                    }
                }}
            >
                <div className="modal-box">
                    <h3 className="font-bold text-lg">MCPサーバの追加</h3>
                    <div className="flex flex-col mt-4">
                        <textarea
                            rows={13}
                            placeholder='{&#13;    "mcpServers": {&#13;        "filesystem": {&#13;            "command": "npx",&#13;            "args": [&#13;                "-y",&#13;                "@modelcontextprotocol/server-filesystem",&#13;                "/Users/username/Desktop",&#13;                "/path/to/other/allowed/dir"&#13;            ]&#13;        }&#13;    }&#13;}'
                            className="p-2.5 h-full rounded-2xl input input-bordered focus:outline-none"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                        <button className="btn mt-2 mb-4 text-secondary"
                            {...((content.length === 0 || connecting) ? { disabled: true } : {})}
                            onClick={handleConnectTestClick}>接続テスト</button>
                    </div>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn mr-2" onClick={() => { setContent(""); setConnecting(false); }}>キャンセル</button>
                            <button className="btn text-primary" {...(isPassedTest ? {} : { disabled: true })}
                                onClick={async () => {
                                    const parsed = JSON.parse(content);
                                    await invoke("add_mcp_config_command", { config: parsed }).then(async () => {
                                        const serverNames = Object.keys(parsed.mcpServers) as string[];
                                        addServerNames(serverNames.map(serverName => serverName.replaceAll('_', '-')));
                                        setReload();
                                    }).catch((e) => {
                                        console.error(e.message);
                                    });
                                    setContent("");
                                    setConnecting(false);
                                }}>追加</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    )
}

export { SettingToolAddButton }