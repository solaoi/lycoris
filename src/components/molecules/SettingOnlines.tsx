import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingOnlineState } from "../../store/atoms/settingOnlineState";

const SettingOnlines = (): JSX.Element => {
    const settingOnlines = ["OpenAI", "AmiVoice"]
    const [settingOnline, setSettingOnline] = useRecoilState(settingOnlineState)

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const settingOnline = e.target.value
        setSettingOnline(settingOnline)
    }

    return (
        <select className="select focus:outline-none pl-1 pr-0 w-32 bg-transparent" name="onlines" onChange={change} >
            {settingOnlines?.map((online, i) => (
                <option key={"setting-online" + i} value={online} selected={online === settingOnline}>{online}</option>
            ))}
        </select>
    )
}

export { SettingOnlines }
