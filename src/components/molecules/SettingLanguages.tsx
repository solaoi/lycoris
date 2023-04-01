import { ChangeEvent } from "react";
import { useRecoilState, useRecoilValue } from 'recoil';
import { recordState } from "../../store/atoms/recordState";
import { settingLanguageState } from "../../store/atoms/settingLanguageState";

const SettingLanguages = (): JSX.Element => {
    const settingLanguages = ["日本語", "英語"]
    const [settingLanguage, setSettingLanguage] = useRecoilState(settingLanguageState)
    const isRecording = useRecoilValue(recordState)

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const settingLanguage = e.target.value
        setSettingLanguage(settingLanguage)
    }

    return (
        <select className="select select-bordered w-full max-w-xs focus:outline-none text-xs disabled:bg-base-300" name="speaker-languages" disabled={isRecording} onChange={change} >
            {settingLanguages?.map((language, i) => (
                <option key={"setting-language" + i} value={language} selected={language === settingLanguage}>{language}</option>
            ))}
        </select>
    )
}

export { SettingLanguages }
