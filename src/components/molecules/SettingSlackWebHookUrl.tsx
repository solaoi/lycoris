import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";
import { TestConnectionOnExternalServiceButton } from "./TestConnectionOnExternalServiceButton";

const SettingSlackWebHookUrl = (): JSX.Element => {
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingSlackWebHookUrl"))
    const change = (e: ChangeEvent<HTMLInputElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex flex-col w-full gap-2">
            <div className="text-sm ml-2 text-gray-500">
                Webhook URL
            </div>
            <input placeholder='https://hooks.slack.com/services/xxxxxxxxxxx/yyyyyyyyyyy/zzzzzzzzzzzzzzzzzzzzzzzz' className="rounded-2xl input input-bordered focus:outline-none" value={settingKey} onChange={change} />
            <TestConnectionOnExternalServiceButton serviceType="slack" disabled={settingKey === ""} />
        </div>
    )
}

export { SettingSlackWebHookUrl }