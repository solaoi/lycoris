import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingAmiVoiceModel = (): JSX.Element => {
    const settingModels = ["general", "medgeneral", "bizmrreport", "bizfinance", "bizinsurance"] as const;
    const modelNameMapper = (model: typeof settingModels[number])=>{
        switch(model){
            case "general":
                return "汎用"
            case "medgeneral":
                return "医療"
            case "bizmrreport":
                return "製薬"
            case "bizfinance":
                return "金融"
            case "bizinsurance":
                return "保険"
        }
    }
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingAmiVoiceModel"))

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center mb-2">
            <p className="w-[12rem]">利用モデル</p>
            <div className="flex flex-col w-full">
                <select className="select select-bordered focus:outline-none text-xs w-fit" name="setting-amivoice-model" onChange={change} >
                    {settingModels?.map((model, i) => (
                        <option key={"setting-model" + i} value={model} selected={model === settingKey}>{modelNameMapper(model)}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

export { SettingAmiVoiceModel }
