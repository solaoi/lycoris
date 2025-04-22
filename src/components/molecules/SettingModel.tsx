import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingModel = (): JSX.Element => {
    const settingModels = [
        "gpt-3.5-turbo",
        "gpt-3.5-turbo-1106",
        "gpt-4",
        "gpt-4-1106-preview",
        "gpt-4-turbo-preview",
        "gpt-4-turbo",
        "gpt-4o-2024-05-13",
        "gpt-4o-2024-08-06",
        "gpt-4o-2024-11-20",
        "gpt-4o",
        "chatgpt-4o-latest",
        "gpt-4o-mini",
        "gpt-4.5-preview",
        "gpt-4.1",
        "gpt-4.1-mini",
        "gpt-4.1-nano",
        "o1-preview",
        "o1-low",
        "o1",
        "o1-high",
        "o1-mini",
        "o3-low",
        "o3",
        "o3-high",
        "o3-mini-low",
        "o3-mini",
        "o3-mini-high",
        "o4-mini-low",
        "o4-mini",
        "o4-mini-high",
        "gpt-4o-search-preview-low",
        "gpt-4o-search-preview",
        "gpt-4o-search-preview-high",
        "gpt-4o-mini-search-preview-low",
        "gpt-4o-mini-search-preview",
        "gpt-4o-mini-search-preview-high",
    ]
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingModel"))

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <p>利用モデル</p>
            <div>
                <select className="select select-bordered focus:outline-none text-xs w-full" name="setting-model" onChange={change} >
                    {settingModels?.map((model, i) => (
                        <option key={"setting-model" + i} value={model} selected={model === settingKey}>{model}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

export { SettingModel }
