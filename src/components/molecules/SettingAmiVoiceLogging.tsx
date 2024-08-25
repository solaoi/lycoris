import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingAmiVoiceLogging = (): JSX.Element => {
    const settingLoggings = ["on", "off"] as const;
    const modelNameMapper = (model: typeof settingLoggings[number])=>{
        switch(model){
            case "on":
                return "有効"
            case "off":
                return "無効"
        }
    }
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingAmiVoiceLogging"))

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center mb-2">
            <p className="w-[12rem]">ログ保存</p>
            <div className="flex flex-col w-full">
                <select className="select select-bordered focus:outline-none text-xs w-fit" name="setting-amivoice-logging" onChange={change} >
                    {settingLoggings?.map((logging, i) => (
                        <option key={"setting-logging" + i} value={logging} selected={logging === settingKey}>{modelNameMapper(logging)}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

export { SettingAmiVoiceLogging }
