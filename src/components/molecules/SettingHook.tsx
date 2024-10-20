import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingHook = (): JSX.Element => {
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingHook"))
    const change = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center">
            <p className="w-[12rem]">CLI Hook</p>
            <div className="flex flex-col w-full">
                <div className="flex flex-col ml-2.5 mb-2">
                    <p className="font-medium mb-2">ターミナルで任意のコマンドを実行（アシスタント返答後）</p>
                    <p>ユーザーの入力を、{"{{question}}"}</p>
                    <p>CLI Resourceを、{"{{resource}}"}</p>
                    <p>アシスタントからの返答を、{"{{answer}}"}、として利用可能</p>
                </div>
                <textarea rows={3} placeholder='echo "{{question}} > {{answer}}" > ~/Desktop/sample.txt' className="p-2.5 h-full rounded-2xl input input-bordered focus:outline-none flex-1" value={settingKey} onChange={change} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); } }} />
            </div>
        </div>
    )
}

export { SettingHook }