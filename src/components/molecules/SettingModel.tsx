import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingModel = (): JSX.Element => {
    const settingModels = ["gpt-3.5-turbo", "gpt-3.5-turbo-1106", "gpt-4", "gpt-4-1106-preview", "gpt-4-turbo-preview", "gpt-4-turbo", "gpt-4o-2024-05-13", "gpt-4o-2024-08-06", "gpt-4o-2024-11-20", "gpt-4o", "chatgpt-4o-latest", "gpt-4o-mini", "o1-preview", "o1", "o1-mini"]
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingModel"))

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center">
            <p className="mr-4">利用モデル</p>
            <div>
                <select className="select select-bordered focus:outline-none text-xs w-fit" name="setting-model" onChange={change} >
                    {settingModels?.map((model, i) => (
                        <option key={"setting-model" + i} value={model} selected={model === settingKey}>{model}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

export { SettingModel }
