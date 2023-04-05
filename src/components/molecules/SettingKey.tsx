import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingKey = (): JSX.Element => {
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState)

    const change = (e: ChangeEvent<HTMLInputElement>) => {
        const settingKey = e.target.value
        console.log("test")
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center">
            <p className="mr-10">APIキー</p>
            <input type="password" placeholder="xx-XXXXXXXXXXXXXXXXXXXXXXXX" className="input input-bordered focus:outline-none flex-1" value={settingKey} onChange={change}/>
        </div>
    )
}

export { SettingKey }
