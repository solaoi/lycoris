import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingTemplate = (): JSX.Element => {
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingTemplate"))
    const change = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center mb-2">
            <p className="w-[12rem]">システム ロール</p>
            <div className="flex flex-col w-full">
                <div className="flex flex-col ml-2.5 mb-2">
                    <p className="font-medium mb-2">アシスタントへの役割設定</p>
                    <p>ユーザーの入力を、{"{{question}}"}</p>
                    <p>CLI Resourceを、{"{{resource}}"}、として利用可能</p>
                </div>
                <textarea rows={5} placeholder='あなたは〇〇の専門家です。&#13;&#13;最新の情報"""&#13;{{resource}}&#13;"""' className="p-2.5 h-full rounded-2xl input input-bordered focus:outline-none" value={settingKey} onChange={change} />
            </div>
        </div>
    )
}

export { SettingTemplate }