import { invoke } from '@tauri-apps/api/core'
import { useRecoilValue } from 'recoil'
import { appWindowState } from '../../store/atoms/appWindowState'
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { selectedNoteState } from '../../store/atoms/selectedNoteState';

type TestConnectionOnExternalServiceButtonProps = {
    serviceType: "slack" | "discord",
    disabled: boolean,
}

const TestConnectionOnExternalServiceButton = (props: TestConnectionOnExternalServiceButtonProps): JSX.Element => {
    const { serviceType, disabled } = props
    const content = "こんにちは、Lycorisへようこそ！";
    const [isSending, setIsSending] = useState(false);

    const click = () => {
        setIsSending(true);
        if (serviceType === "slack") {
            invoke('send_slack_message_command', { content })
                .then(
                    () => {
                        toast.success("こんにちは、Lycorisへようこそ！", {
                            pauseOnFocusLoss: false,
                            autoClose: 2500
                        });
                    }
                )
                .catch(e => {
                    console.error(`Slackメッセージの送信に失敗しました: ${e}`)
                    toast.error("Slackメッセージの送信に失敗しました", {
                        pauseOnFocusLoss: false,
                        autoClose: 2500
                    });
                }).finally(() => {
                    setIsSending(false);
                });
        } else if (serviceType === "discord") {
            invoke('send_discord_message_command', { content })
                .then(
                    () => {
                        toast.success("こんにちは、Lycorisへようこそ！", {
                            pauseOnFocusLoss: false,
                            autoClose: 2500
                        });
                    }
                )
                .catch(e => {
                    console.error(`Discordメッセージの送信に失敗しました: ${e}`)
                    toast.error("Discordメッセージの送信に失敗しました", {
                        pauseOnFocusLoss: false,
                        autoClose: 2500
                    });
                }).finally(() => {
                    setIsSending(false);
                });
        }
    }

    return (
        <button className="btn gap-2 bg-white border border-solid border-neutral-300 text-primary w-full" disabled={disabled || isSending} onClick={click}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
            </svg>
            接続テスト
        </button>
    )
}

export { TestConnectionOnExternalServiceButton }