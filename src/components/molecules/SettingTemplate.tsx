import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

type SettingTemplateProps = {
    templateName: string;
}

const SettingTemplate = (props: SettingTemplateProps): JSX.Element => {
    const { templateName } = props;
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState(templateName))
    const change = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    return (
        <div className="flex items-center">
            <p className="w-[9rem]">AI - System Role -</p>
            <textarea rows={5} placeholder="あなたは○○の専門家です。" className="p-2.5 h-full rounded-2xl input input-bordered focus:outline-none flex-1" value={settingKey} onChange={change} />
        </div>
    )
}

export { SettingTemplate }