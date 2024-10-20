import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingFCfunctions = (): JSX.Element => {
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingFCfunctions"))
    const change = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center mb-2">
            <p className="w-[12rem]">Function Calling<br />(functions)</p>
            <div className="flex flex-col w-full">
                <div className="flex flex-col ml-2.5 mb-2">
                    <p className="font-medium">アシスタントからの返答に利用する関数一覧</p>
                </div>
                <textarea rows={16} placeholder='[&#13;    {&#13;        "name": "functionA_name",&#13;        "description": "functionA_description",&#13;        "parameters": {&#13;            "type": "object",&#13;            "properties": {&#13;                "sample": {&#13;                    "type": "string",&#13;                    "description": "sample property description"&#13;                }&#13;            },&#13;            "required": ["sample"]&#13;        }&#13;    }&#13;]' className="p-2.5 h-full rounded-2xl input input-bordered focus:outline-none" value={settingKey} onChange={change} />
            </div>
        </div>
    )
}

export { SettingFCfunctions }