import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingAILanguage = (): JSX.Element => {
    const settingAILanguages = ["None", "Kyoko", "Samantha", "Tingting", "Yuna", "Thomas", "Anna", "Milena", "Mónica", "Luciana", "Yelda", "Linh", "Alice", "Xander", "Montse", "Lesya", "Alva", "Lekha", "Zuzana", "Zosia"]
    const [settingKey, setSettingKey] = useRecoilState(settingKeyState("settingAILanguage"))

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const settingKey = e.target.value
        setSettingKey(settingKey)
    }

    const mapper = (aiLanguage: string) => {
        switch (aiLanguage) {
            case "None":
                return "しない";
            case "Kyoko":
                return "日本語";
            case "Samantha":
                return "英語";
            case "Tingting":
                return "中国語";
            case "Yuna":
                return "韓国語";
            case "Thomas":
                return "フランス語";
            case "Anna":
                return "ドイツ語";
            case "Milena":
                return "ロシア語";
            case "Mónica":
                return "スペイン語";
            case "Luciana":
                return "ポルトガル語";
            case "Yelda":
                return "トルコ語";
            case "Linh":
                return "ベトナム語";
            case "Alice":
                return "イタリア語";
            case "Xander":
                return "オランダ語";
            case "Montse":
                return "カタルーニャ語";
            case "Lesya":
                return "ウクライナ語";
            case "Alva":
                return "スウェーデン語";
            case "Lekha":
                return "ヒンディー語";
            case "Zuzana":
                return "チェコ語";
            case "Zosia":
                return "ポーランド語";
            default:
                throw new Error("unknown languageType");
        }
    }

    return (
        <div className="flex items-center mb-2">
            <p className="w-[12rem]">発話</p>
            <div className="flex flex-col w-full">
                <select className="select select-bordered focus:outline-none text-xs w-fit" name="setting-aiLanguage" onChange={change} >
                    {settingAILanguages?.map((aiLanguage, i) => (
                        <option key={"setting-aiLanguage" + i} value={aiLanguage} selected={aiLanguage === settingKey}>{mapper(aiLanguage)}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

export { SettingAILanguage }
