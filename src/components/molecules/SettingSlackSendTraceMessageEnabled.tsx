import { useRecoilState, useRecoilValue } from "recoil";
import { settingSlackSendTraceMessageEnabledState } from "../../store/atoms/settingSlackSendTraceMessageEnabledState";
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingSlackSendTraceMessageEnabled = (): JSX.Element => {
    const [slackSendTraceMessageEnabled, setSlackSendTraceMessageEnabled] = useRecoilState(settingSlackSendTraceMessageEnabledState);
    const settingKey = useRecoilValue(settingKeyState("settingSlackWebHookUrl"))

    return (
        <div className="flex items-center">
            <div className="font-bold text-gray-600 mr-2">
                <label className="cursor-pointer label">
                    <span className="label-text inline-flex mr-2 w-32">
                        <p className="text-base-content/40">追っかけ文字起こし</p>
                    </span>
                    <input type="checkbox"
                        className={"toggle toggle-accent"}
                        checked={slackSendTraceMessageEnabled === 1}
                        disabled={settingKey === ""}
                        onChange={(e) => {
                            setSlackSendTraceMessageEnabled(e.target.checked ? 1 : 0);
                        }}
                    />
                </label>
            </div>
        </div>
    )
}

export { SettingSlackSendTraceMessageEnabled }