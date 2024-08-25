import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingLanguageState } from "../../store/atoms/settingLanguageState";

const SettingLanguages = (): JSX.Element => {
    const settingLanguages = ["日本語", "英語", "中国語", "韓国語", "フランス語", "ドイツ語", "ロシア語", "スペイン語", "ポルトガル語", "トルコ語", "ベトナム語", "イタリア語", "オランダ語", "カタルーニャ語", "ウクライナ語", "スウェーデン語", "ヒンディー語", "チェコ語", "ポーランド語"]
    const [settingLanguage, setSettingLanguage] = useRecoilState(settingLanguageState)

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const settingLanguage = e.target.value
        setSettingLanguage(settingLanguage)
    }

    return (
        <select className="select focus:outline-none pl-1 pr-0 w-32" name="speaker-languages" onChange={change} >
            {settingLanguages?.map((language, i) => (
                <option key={"setting-language" + i} value={language} selected={language === settingLanguage}>{language}</option>
            ))}
        </select>
    )
}

export { SettingLanguages }
