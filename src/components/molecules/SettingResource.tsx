import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

type SettingResourceProps = {
    resourceName: string;
}

const SettingResource = (props: SettingResourceProps): JSX.Element => {
    const { resourceName } = props;
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState(resourceName))
    const change = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center mb-2">
            <p className="w-[8rem]">CLI Resource</p>
            <textarea rows={3} placeholder='curl -s "https://example.com/latest?query={{question}}"' className="p-2.5 h-full rounded-2xl input input-bordered focus:outline-none flex-1" value={settingKey} onChange={change} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); } }} />
        </div>
    )
}

export { SettingResource }