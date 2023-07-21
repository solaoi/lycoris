import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingResource = (): JSX.Element => {
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingResource"))
    const change = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center mb-2">
            <p className="w-[12rem]">CLI Resource</p>
            <div className="flex flex-col w-full">
                <div className="flex flex-col ml-2.5 mb-2">
                    <p className="font-medium mb-2">ターミナルで任意のコマンドを実行（AI実行前）</p>
                    <p>ユーザーの入力を、{"{{question}}"}、として利用可能</p>
                </div>
                <textarea rows={3} placeholder='curl -s "https://example.com/latest?query={{question}}"' className="p-2.5 h-full rounded-2xl input input-bordered focus:outline-none" value={settingKey} onChange={change} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); } }} />
            </div>
        </div>
    )
}

export { SettingResource }