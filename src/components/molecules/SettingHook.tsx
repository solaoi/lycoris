import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

type SettingHookProps = {
    hookName: string;
}

const SettingHook = (props: SettingHookProps): JSX.Element => {
    const { hookName } = props;
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState(hookName))
    const change = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center">
            <p className="w-[8rem]">CLI Hook</p>
            <textarea rows={3} placeholder='echo "{{question}} > {{answer}}" > ~/Desktop/sample.txt' className="p-2.5 h-full rounded-2xl input input-bordered focus:outline-none flex-1" value={settingKey} onChange={change} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); } }} />
        </div>
    )
}

export { SettingHook }