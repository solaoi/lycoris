import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingModel = (): JSX.Element => {
    const settingModels = ["gpt-3.5-turbo", "gpt-4"]
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingModel"))

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center mb-2">
            <p className="w-[8rem]">利用モデル</p>
            <select className="select select-bordered focus:outline-none text-xs" name="setting-model" onChange={change} >
                {settingModels?.map((model, i) => (
                    <option key={"setting-model" + i} value={model} selected={model === settingKey}>{model}</option>
                ))}
            </select>
        </div>
    )
}

export { SettingModel }
