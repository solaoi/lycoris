import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

type SettingKeyProps = {
    settingName: string;
}

const SettingKey = (props: SettingKeyProps): JSX.Element => {
    const { settingName } = props;
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState(settingName))
    const placeholder = (() => {
        if (settingName === "settingKeyOpenai") {
            return "xx-XXXXXXXXXXXXXXXXXXXXXXXX"
        } else if (settingName === "settingKeyDeepl") {
            return "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxxxx"
        } else {
            return "xxxxxxxxxxxxxxxxxxxxxxxxxxx"
        }
    })()
    const change = (e: ChangeEvent<HTMLInputElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center">
            <p className="w-[8rem]">API キー</p>
            <input type="password" placeholder={placeholder} className="input input-bordered focus:outline-none flex-1" value={settingKey} onChange={change} />
        </div>
    )
}

export { SettingKey }
