import { useRecoilState, useRecoilValue } from "recoil";
import { settingTranslationLanguagesState } from "../../store/atoms/settingTranslationLanguagesState";
import { modelNllbDownloadedState } from "../../store/atoms/modelNllbDownloadedState";
import { settingKeyState } from "../../store/atoms/settingKeyState";

const SettingsSelectTranslations = (): JSX.Element => {
    const settingKeyDeepl = useRecoilValue(settingKeyState("settingKeyDeepl"))
    const downloadedModels = useRecoilValue(modelNllbDownloadedState);
    const disabled = settingKeyDeepl === "" && downloadedModels.length === 0
    const translationLanguages = ["日本語", "中国語", "韓国語", "フランス語", "ドイツ語", "ロシア語", "スペイン語", "ポルトガル語", "トルコ語", "ベトナム語", "イタリア語", "オランダ語", "カタルーニャ語", "ウクライナ語", "スウェーデン語", "ヒンディー語", "チェコ語", "ポーランド語"]
    const [activeLanguages, setActiveLanguages] = useRecoilState(settingTranslationLanguagesState);
    const change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { target } = e;
        if (target.checked) {
            setActiveLanguages(prev => [...prev, target.value])
        } else {
            setActiveLanguages(prev => prev.filter(p => p !== target.value))
        }
    }

    return (
        <div className="mb-8">
            <p className="mb-2">※ 利用する言語を選択してください。</p>
            <div className="flex flex-wrap justify-between mr-[-0.25rem]">
                {translationLanguages.map((l, i) => (
                    <div key={`translation-${l}`} className={`cursor-pointer flex-1 min-w-max flex items-baseline mb-1 mr-1 pr-4 pl-4 border border-gray-200 rounded hover:bg-base-300${disabled ? " bg-base-300" : ""}`}>
                        <input id={`bordered-checkbox-${i}`} type="checkbox" checked={activeLanguages.includes(l)} onChange={change} value={l} name="bordered-checkbox" className="cursor-pointer text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" disabled={disabled} />
                        <label htmlFor={`bordered-checkbox-${i}`} className="cursor-pointer w-full py-4 ml-2 text-sm font-medium text-gray-900">{l}</label>
                    </div>
                ))}
            </div>
        </div>)
}

export { SettingsSelectTranslations }