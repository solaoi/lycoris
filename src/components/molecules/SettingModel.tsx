import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingModel = (): JSX.Element => {
    const settingModels = ["gpt-3.5-turbo", "gpt-3.5-turbo-1106", "gpt-4", "gpt-4-1106-preview", "gpt-4-turbo-preview"]
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingModel"))

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center mb-2">
            <p className="w-[12rem]">利用モデル</p>
            <div className="flex flex-col w-full">
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
