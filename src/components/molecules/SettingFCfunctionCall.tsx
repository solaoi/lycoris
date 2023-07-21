import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingFCfunctionCall = (): JSX.Element => {
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingFCfunctionCall"))
    const change = (e: ChangeEvent<HTMLInputElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center mb-2">
            <p className="w-[12rem]">Function Calling<br />(function_call)</p>
            <div className="flex flex-col w-full">
                <div className="flex flex-col ml-2.5 mb-2">
                    <p className="font-medium">AIからの返答に利用する関数を選択</p>
                    <p>無指定では、必要なときのみ関数が実行されます</p>
                    <p>必ず実行する場合は、関数名を指定してください</p>
                </div>
                <div className="flex flex-col w-full">
                    <input type="text" placeholder="functionA_name" className="rounded-2xl input input-bordered focus:outline-none" value={settingKey} onChange={change} />
                </div>
            </div>
        </div>
    )
}

export { SettingFCfunctionCall }