import { useRecoilState, useRecoilValue } from "recoil";
import { settingDiscordSendTraceMessageEnabledState } from "../../store/atoms/settingDiscordSendTraceMessageEnabledState";
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingDiscordSendTraceMessageEnabled = (): JSX.Element => {
    const [discordSendTraceMessageEnabled, setDiscordSendTraceMessageEnabled] = useRecoilState(settingDiscordSendTraceMessageEnabledState);
    const settingKey = useRecoilValue(settingKeyState("settingDiscordWebHookUrl"))

    return (
        <div className="flex items-center">
            <div className="font-bold text-gray-600 mr-2">
                <label className="cursor-pointer label">
                    <span className="label-text inline-flex mr-2 w-32">
                        <p className="text-base-content/40">追っかけ文字起こし</p>
                    </span>
                    <input type="checkbox"
                        className={"toggle toggle-accent"}
                        checked={discordSendTraceMessageEnabled === 1}
                        disabled={settingKey === ""}
                        onChange={(e) => {
                            setDiscordSendTraceMessageEnabled(e.target.checked ? 1 : 0);
                        }}
                    />
                </label>
            </div>
        </div>
    )
}

export { SettingDiscordSendTraceMessageEnabled }