import { useRecoilValue } from "recoil"
import { settingLanguageState } from "../../store/atoms/settingLanguageState"
import { settingProcessState } from "../../store/atoms/settingProcessState"
import { settingOnlineState } from "../../store/atoms/settingOnlineState"
import { ModelDownloadVoskButton } from "../molecules/ModelDownloadVoskButton"
import { ModelDownloadVoskProgress } from "../molecules/ModelDownloadVoskProgress"
import { ModelDownloadWhisperButton } from "../molecules/ModelDownloadWhisperButton"
import { ModelDownloadWhisperProgress } from "../molecules/ModelDownloadWhisperProgress"
import { SettingKey } from "../molecules/SettingKey"
import { SettingLanguages } from "../molecules/SettingLanguages"
import { SettingTemplate } from "../molecules/SettingTemplate"
import { SettingFCfunctions } from "../molecules/SettingFCfunctions"
import { SettingFCfunctionCall } from "../molecules/SettingFCfunctionCall"
import { SettingHook } from "../molecules/SettingHook"
import { SettingResource } from "../molecules/SettingResource"
import { SettingModel } from "../molecules/SettingModel"
import { SettingAILanguage } from "../molecules/SettingAILanguage"
import { SettingAmiVoiceModel } from "../molecules/SettingAmiVoiceModel"
import { ModelDownloadFugumtEnJaButton } from "../molecules/ModelDownloadFugumtEnJaButton"
import { ModelDownloadFugumtEnJaProgress } from "../molecules/ModelDownloadFugumtEnJaProgress"
import { ModelDownloadHonyaku13BButton } from "../molecules/ModelDownloadHonyaku13BButton"
import { ModelDownloadHonyaku13BProgress } from "../molecules/ModelDownloadHonyaku13BProgress"
import { SettingProcesses } from "../molecules/SettingProcesses"
import { SettingOnlines } from "../molecules/SettingOnlines"
import { SettingAmiVoiceLogging } from "../molecules/SettingAmiVoiceLogging"
import { ModelDownloadStyleBertVits2Button } from "../molecules/ModelDownloadStyleBertVits2Button"
import { ModelDownloadStyleBertVits2Progress } from "../molecules/ModelDownloadStyleBertVits2Progress"
import { SettingVoices } from "../molecules/SettingVoices"
import { ModelDownloadStyleBertVits2VoiceButton } from "../molecules/ModelDownloadStyleBertVits2VoiceButton"
import { ModelDownloadStyleBertVits2VoiceProgress } from "../molecules/ModelDownloadStyleBertVits2VoiceProgress"
import { settingVoiceState } from "../../store/atoms/settingVoiceState"
import { ModelDownloadFugumtJaEnButton } from "../molecules/ModelDownloadFugumtJaEnButton"
import { ModelDownloadFugumtJaEnProgress } from "../molecules/ModelDownloadFugumtJaEnProgress"
import { ModelDownloadReazonSpeechButton } from "../molecules/ModelDownloadReazonSpeechButton"
import { ModelDownloadReazonSpeechProgress } from "../molecules/ModelDownloadReazonSpeechProgress"
import { useState } from "react"
import { SettingToolContent } from "../molecules/SettingToolContent"

const SettingsMain = (): JSX.Element => {
    const settingLanguage = useRecoilValue(settingLanguageState);
    const settingProcess = useRecoilValue(settingProcessState);
    const settingOnline = useRecoilValue(settingOnlineState);
    const settingVoice = useRecoilValue(settingVoiceState);
    const [settingCategory, setSettingCategory] = useState<0 | 1 | 2 | 3>(0);

    return (
        <div className="settings py-5 pl-8" >
            <h1 className="text-3xl flex items-center cursor-default h-[36px]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                設定
            </h1>
            <ul className="menu menu-horizontal menu-xs bg-base-200 rounded gap-2 mt-8 p-[4px] mb-2 text-gray-400 h-[32px]">
                <li><button onClick={() => { if (settingCategory !== 0) { setSettingCategory(0); } }} className={settingCategory === 0 ? "active" : ""}>基本設定</button></li>
                <li><button onClick={() => { if (settingCategory !== 1) { setSettingCategory(1); } }} className={settingCategory === 1 ? "active" : ""}>オンライン設定</button></li>
                <li><button onClick={() => { if (settingCategory !== 2) { setSettingCategory(2); } }} className={settingCategory === 2 ? "active" : ""}>各種アクション</button></li>
                <li><button onClick={() => { if (settingCategory !== 3) { setSettingCategory(3); } }} className={settingCategory === 3 ? "active" : ""}>スマート読み上げ</button></li>
            </ul>
            <div className="settings-inner overflow-auto mr-8 pb-4" style={{ height: `calc(100vh - 200px)` }}>
                {settingCategory === 0 && (
                    <div className="mt-2">
                        <div className="px-5 cursor-default border pt-4 bg-white/60 drop-shadow-md rounded-lg">
                            <h2 className="text-xl mt-5 mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                                </svg>
                                話し手の言語
                            </h2>
                            <div className="px-5 mt-2">
                                <div className="mb-8">
                                    <p>音声認識を行う対象の、言語パックをダウンロードしてください。</p>
                                    <p>言語によっては、メモリ使用量が少ないライト版のみ存在します。</p>
                                </div>
                                <div className="mb-4 border-b">
                                    <SettingLanguages />
                                </div>
                                {settingLanguage === "日本語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">48 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-ja-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-ja-0.22" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（通常）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">1.0 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="ja-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="ja-0.22" />
                                    </div>
                                </>}
                                {settingLanguage === "英語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">40 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-en-us-0.15" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-en-us-0.15" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（通常）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">1.8 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="en-us-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="en-us-0.22" />
                                    </div>
                                </>}
                                {settingLanguage === "中国語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">42 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-cn-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-cn-0.22" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（通常）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">1.3 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="cn-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="cn-0.22" />
                                    </div>
                                </>}
                                {settingLanguage === "韓国語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">82 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-ko-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-ko-0.22" />
                                    </div>
                                </>}
                                {settingLanguage === "フランス語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">41 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-fr-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-fr-0.22" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（通常）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">1.4 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="fr-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="fr-0.22" />
                                    </div>
                                </>}
                                {settingLanguage === "ドイツ語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">45 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-de-0.15" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-de-0.15" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（通常）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">1.9 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="de-0.21" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="de-0.21" />
                                    </div>
                                </>}
                                {settingLanguage === "ロシア語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">45 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-ru-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-ru-0.22" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（通常）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">1.8 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="ru-0.42" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="ru-0.42" />
                                    </div>
                                </>}
                                {settingLanguage === "スペイン語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">39 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-es-0.42" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-es-0.42" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（通常）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">1.4 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="es-0.42" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="es-0.42" />
                                    </div>
                                </>}
                                {settingLanguage === "ポルトガル語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">31 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-pt-0.3" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-pt-0.3" />
                                    </div>
                                </>}
                                {settingLanguage === "トルコ語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">35 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-tr-0.3" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-tr-0.3" />
                                    </div>
                                </>}
                                {settingLanguage === "ベトナム語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">32 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-vn-0.4" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-vn-0.4" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（通常）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">78 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="vn-0.4" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="vn-0.4" />
                                    </div>
                                </>}
                                {settingLanguage === "イタリア語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">48 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-it-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-it-0.22" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（通常）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">1.2 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="it-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="it-0.22" />
                                    </div>
                                </>}
                                {settingLanguage === "オランダ語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">39 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-nl-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-nl-0.22" />
                                    </div>
                                </>}
                                {settingLanguage === "カタルーニャ語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">42 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-ca-0.4" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-ca-0.4" />
                                    </div>
                                </>}
                                {settingLanguage === "ウクライナ語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">133 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-uk-v3-small" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-uk-v3-small" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（通常）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">343 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="uk-v3" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="uk-v3" />
                                    </div>
                                </>}
                                {settingLanguage === "スウェーデン語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">289 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-sv-rhasspy-0.15" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-sv-rhasspy-0.15" />
                                    </div>
                                </>}
                                {settingLanguage === "ヒンディー語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">42 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-hi-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-hi-0.22" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（通常）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">1.5 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="hi-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="hi-0.22" />
                                    </div>
                                </>}
                                {settingLanguage === "チェコ語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">44 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-cs-0.4-rhasspy" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-cs-0.4-rhasspy" />
                                    </div>
                                </>}
                                {settingLanguage === "ポーランド語" && <>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>言語パック（ライト）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">50 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadVoskButton modelType="small-pl-0.22" />
                                        </div>
                                        <ModelDownloadVoskProgress modelType="small-pl-0.22" />
                                    </div>
                                </>}
                            </div>
                        </div>
                        <div className="px-5 cursor-default mt-4 border pt-4 bg-white/60 drop-shadow-md rounded-lg">
                            <h2 className="text-xl mt-5 mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                </svg>
                                追っかけ文字起こし・翻訳
                            </h2>
                            <div className="px-5 mt-2">
                                <div className="mb-8">
                                    <p>通常の文字起こしを追いかける形式で、高精度の文字起こしや翻訳を行います。</p>
                                    <p>各パックをダウンロードするか、オンライン設定を行ってください。</p>
                                </div>
                                <div className="mb-4 border-b">
                                    <SettingProcesses />
                                </div>
                                {settingProcess === "文字起こし（汎用）" && <>
                                    <p className="text-sm mt-4 mb-4">汎用パック（高精度）を推奨します。<br />速度・メモリ使用量に問題がある場合は、汎用パック（速度優先）を利用ください。</p>
                                    {/* <div className="h-[86px]" >
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p>汎用パック（低精度）</p>
                                    <div className="flex my-1">
                                        <div className="badge bg-slate-400 text-white">whisper-small</div>
                                        <div className="badge bg-slate-400 text-white ml-1">447 MB</div>
                                    </div>
                                </div>
                                <ModelDownloadWhisperButton modelType="small" />
                            </div>
                            <ModelDownloadWhisperProgress modelType="small" />
                        </div> */}
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>汎用パック（中精度）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">whisper-medium</div>
                                                    <div className="badge bg-slate-400 text-white ml-1">1.4 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadWhisperButton modelType="medium" />
                                        </div>
                                        <ModelDownloadWhisperProgress modelType="medium" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>汎用パック（高精度）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">whisper-large-v3</div>
                                                    <div className="badge bg-slate-400 text-white ml-1">2.9 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadWhisperButton modelType="large" />
                                        </div>
                                        <ModelDownloadWhisperProgress modelType="large" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>汎用パック（速度優先）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">whisper-large-v3-turbo</div>
                                                    <div className="badge bg-slate-400 text-white ml-1">1.5 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadWhisperButton modelType="large-turbo" />
                                        </div>
                                        <ModelDownloadWhisperProgress modelType="large-turbo" />
                                    </div>
                                </>}
                                {settingProcess === "文字起こし（言語特化）" && <>
                                    <p className="text-sm mt-4 mb-4">汎用パック（高精度）を推奨します。</p>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>英語パック</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">distil-whisper/distil-large-v3</div>
                                                    <div className="badge bg-slate-400 text-white ml-1">1.4 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadWhisperButton modelType="large-distil.en" />
                                        </div>
                                        <ModelDownloadWhisperProgress modelType="large-distil.en" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>日本語パック1</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">Kotoba-Whisper-v2.0</div>
                                                    <div className="badge bg-slate-400 text-white ml-1">1.2 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadWhisperButton modelType="large-distil.ja" />
                                        </div>
                                        <ModelDownloadWhisperProgress modelType="large-distil.ja" />
                                    </div>
                                    <div className="h-[106px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>日本語パック2</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">reazonspeech-k2-v2</div>
                                                    <div className="badge bg-slate-400 text-white ml-1">1.3 GB</div>
                                                </div>
                                                <p className="text-sm">
                                                    ※ 追っかけ開始が遅い代わりに、高速な文字起こしを行います。
                                                </p>
                                            </div>
                                            <ModelDownloadReazonSpeechButton />
                                        </div>
                                        <ModelDownloadReazonSpeechProgress />
                                    </div>
                                </>}
                                {settingProcess === "翻訳（18言語⇒日本語）" && <>
                                    <p className="text-sm mt-4 mb-4">有効化するには、文字起こし（汎用）の汎用パック（高精度）が必要です。</p>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>日本語パック（標準）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">staka/fugumt-en-ja</div>
                                                    <div className="badge bg-slate-400 text-white ml-1">114 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadFugumtEnJaButton />
                                        </div>
                                        <ModelDownloadFugumtEnJaProgress />
                                    </div>
                                    <div className="h-[106px]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>日本語パック（精度優先）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">aixsatoshi/Honyaku-13b</div>
                                                    <div className="badge bg-slate-400 text-white ml-1">7.1 GB</div>
                                                </div>
                                                <p className="text-sm">
                                                    ※ メモリ解放されないバグのため、利用後にアプリ再起動が必要。
                                                </p>
                                            </div>
                                            <ModelDownloadHonyaku13BButton />
                                        </div>
                                        <ModelDownloadHonyaku13BProgress />
                                    </div>
                                </>}
                                {settingProcess === "翻訳（日本語⇒英語）" && <>
                                    <p className="text-sm mt-4 mb-4">有効化するには、文字起こし（汎用）の汎用パック（高精度）が必要です。</p>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>英語パック（標準）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">staka/fugumt-ja-en</div>
                                                    <div className="badge bg-slate-400 text-white ml-1">114 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadFugumtJaEnButton />
                                        </div>
                                        <ModelDownloadFugumtJaEnProgress />
                                    </div>
                                </>}
                                {settingProcess === "翻訳（日本語⇔英語）" && <>
                                    <p className="text-sm mt-4 mb-4">翻訳（18言語⇒日本語）及び翻訳（日本語⇒英語）にて、<br />速度に問題がある場合は、バイリンガルパックを利用ください。</p>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>バイリンガルパック</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white">kotoba-whisper-bilingual-v1.0</div>
                                                    <div className="badge bg-slate-400 text-white ml-1">1.2 GB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadWhisperButton modelType="large-distil.bilingual" />
                                        </div>
                                        <ModelDownloadWhisperProgress modelType="large-distil.bilingual" />
                                    </div>
                                </>}
                            </div>
                        </div>
                    </div>
                )}
                {settingCategory === 1 && (
                    <div className="mt-2">
                        <div className="px-5 cursor-default border pt-4 pb-8 bg-white/60 drop-shadow-md rounded-lg">
                            <h2 className="text-xl mt-5 mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                                </svg>
                                オンライン設定
                            </h2>
                            <div className="px-5 mt-2">
                                <div className="mb-8">
                                    <p>利用したい各APIとの疎通設定を行ってください。</p>
                                </div>
                                <div className="mb-4 border-b">
                                    <SettingOnlines />
                                </div>
                            </div>
                            <div className="pl-5">
                                {settingOnline === "OpenAI" && <>
                                    <div className="mb-6 text-sm">
                                        <p>高速な追っかけ文字起こし・翻訳やアシスタントが選択可能となります。</p>
                                        <p className="pb-2">あなたのアカウントのTierに応じて、利用可能なモデルが異なります。</p>
                                        <a className="text-[#0f83fd]" href="https://platform.openai.com/settings/organization/limits" target="_blank">https://platform.openai.com/settings/organization/limits</a>
                                    </div>
                                    <div className="mb-8">
                                        <SettingKey settingName="settingKeyOpenai" />
                                    </div>

                                    <div className="mt-8 mb-4">
                                        <p className="mb-2">アシスタント設定</p>
                                        <hr />
                                    </div>
                                    <div className="mb-8">
                                        <SettingAILanguage />
                                    </div>
                                    <div className="mb-8">
                                        <SettingResource />
                                    </div>
                                    <div className="mb-8">
                                        <SettingTemplate />
                                    </div>
                                    <div className="mb-8">
                                        <SettingFCfunctions />
                                    </div>
                                    <div className="mb-8">
                                        <SettingFCfunctionCall />
                                    </div>
                                    <SettingHook />
                                </>}
                                {settingOnline === "AmiVoice" && <>
                                    <div className="mb-4 text-sm">
                                        <p>特定の業界に特化した文字起こしが選択可能となります。</p>
                                    </div>
                                    <div className="mb-8">
                                        <SettingKey settingName="settingKeyAmivoice" />
                                    </div>
                                    <div className="mb-8">
                                        <SettingAmiVoiceModel />
                                    </div>
                                    <SettingAmiVoiceLogging />
                                </>}
                            </div>
                        </div>
                    </div>
                )}
                {settingCategory === 2 && (
                    <div className="mt-2">
                        <div className="px-5 cursor-default border pt-4 pb-8 bg-white/60 drop-shadow-md rounded-lg">
                            <h2 className="text-xl mt-5 mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                                </svg>
                                チャット
                            </h2>
                            <div className="px-5 mt-2 flex flex-col gap-4">
                                <div>
                                    <p>チャットで利用するモデルを指定できます。</p>
                                </div>
                                <SettingModel />
                            </div>
                        </div>
                        <div className="px-5 cursor-default border pt-4 pb-8 mt-4 bg-white/60 drop-shadow-md rounded-lg">
                            <h2 className="text-xl mt-5 mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
                                </svg>
                                ツール
                            </h2>
                            <div className="px-5 mt-2 flex flex-col gap-4">
                                <div>
                                    <p>Model Context Protocol（MCP）に対応するサーバを、ツールとして追加できます。</p>
                                </div>
                                <SettingToolContent />
                            </div>
                        </div>
                    </div>
                )}
                {settingCategory === 3 && (
                    <div className="mt-2">
                        <div className="px-5 cursor-default border pt-4 bg-white/60 drop-shadow-md rounded-lg">
                            <h2 className="text-xl mt-5 mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
                                </svg>
                                スマート読み上げ
                            </h2>
                            <div className="px-5 mt-2">
                                <div className="mb-8">
                                    <p>テキストを感情豊かな音声で読み上げます。現在は発話サジェストで有効です。</p>
                                    <p>基本エンジンをダウンロードの上、各ボイスパックをダウンロードしてください。</p>
                                </div>
                                <div className="h-[86px]" >
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p>基本エンジン</p>
                                            <div className="flex my-1">
                                                <div className="badge bg-slate-400 text-white">Style-Bert-VITS2 JP-Extra</div>
                                                <div className="badge bg-slate-400 text-white ml-1">1.2 GB</div>
                                            </div>
                                        </div>
                                        <ModelDownloadStyleBertVits2Button />
                                    </div>
                                    <ModelDownloadStyleBertVits2Progress />
                                </div>
                                <div className="mb-4 border-b">
                                    <SettingVoices />
                                </div>
                                {settingVoice === "JVNV" && <>
                                    <div className="text-sm mt-4 mb-4">
                                        <p>
                                            <a className="text-[#0f83fd]" href="https://sites.google.com/site/shinnosuketakamichi/research-topics/jvnv_corpus" target="_blank">JVNVコーパス</a>の音声で学習されました。
                                        </p>
                                        <p>このコーパスのライセンスは、<a className="text-[#0f83fd]" href="https://creativecommons.org/licenses/by-sa/4.0/deed.ja" target="_blank">CC BY-SA 4.0</a>のため、利用規約はこれを継承します。</p>
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>ボイスパック（女性1：jvnv-F1-jp）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white ml-1">231 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadStyleBertVits2VoiceButton modelType="jvnv-F1-jp" />
                                        </div>
                                        <ModelDownloadStyleBertVits2VoiceProgress modelType="jvnv-F1-jp" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>ボイスパック（女性2：jvnv-F2-jp）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white ml-1">231 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadStyleBertVits2VoiceButton modelType="jvnv-F2-jp" />
                                        </div>
                                        <ModelDownloadStyleBertVits2VoiceProgress modelType="jvnv-F2-jp" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>ボイスパック（男性1：jvnv-M1-jp）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white ml-1">231 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadStyleBertVits2VoiceButton modelType="jvnv-M1-jp" />
                                        </div>
                                        <ModelDownloadStyleBertVits2VoiceProgress modelType="jvnv-M1-jp" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>ボイスパック（男性2：jvnv-M2-jp）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white ml-1">231 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadStyleBertVits2VoiceButton modelType="jvnv-M2-jp" />
                                        </div>
                                        <ModelDownloadStyleBertVits2VoiceProgress modelType="jvnv-M2-jp" />
                                    </div>
                                </>}
                                {settingVoice === "つくよみちゃん" && <>
                                    <div className="text-sm mt-4 mb-4">
                                        <p className="mb-4">
                                            本ソフトウェアの音声合成には、<br />フリー素材キャラクター「つくよみちゃん」が無料公開している音声データを使用しています。
                                        </p>
                                        <p>■つくよみちゃんコーパス（CV.夢前黎）</p>
                                        <a className="text-[#0f83fd]" href="https://tyc.rei-yumesaki.net/material/corpus/" target="_blank">https://tyc.rei-yumesaki.net/material/corpus/</a>
                                        <p className="mt-2">© Rei Yumesaki</p>
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>ボイスパック（つくよみちゃん）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white ml-1">231 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadStyleBertVits2VoiceButton modelType="tsukuyomi-chan" />
                                        </div>
                                        <ModelDownloadStyleBertVits2VoiceProgress modelType="tsukuyomi-chan" />
                                    </div>
                                </>}
                                {settingVoice === "小春音アミ・あみたろ" && <>
                                    <div className="text-sm mt-4 mb-4">
                                        <p>
                                            <a className="text-[#0f83fd]" href="https://amitaro.net/" target="_blank">あみたろの声素材工房</a>のコーパス音声・ライブ配信音声から許可を得て学習されたモデルを使用しています。
                                        </p>
                                        <p>
                                            利用の際には、<a className="text-[#0f83fd]" href="https://amitaro.net/voice/voice_rule/" target="_blank">あみたろの声素材工房の規約</a>と<a className="text-[#0f83fd]" href="https://amitaro.net/voice/voice_rule/" target="_blank">あみたろのライブ配信音声・利用規約</a>を遵守してください。
                                        </p>
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>ボイスパック（小春音アミ）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white ml-1">231 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadStyleBertVits2VoiceButton modelType="koharune-ami" />
                                        </div>
                                        <ModelDownloadStyleBertVits2VoiceProgress modelType="koharune-ami" />
                                    </div>
                                    <div className="h-[86px]" >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p>ボイスパック（あみたろ）</p>
                                                <div className="flex my-1">
                                                    <div className="badge bg-slate-400 text-white ml-1">231 MB</div>
                                                </div>
                                            </div>
                                            <ModelDownloadStyleBertVits2VoiceButton modelType="amitaro" />
                                        </div>
                                        <ModelDownloadStyleBertVits2VoiceProgress modelType="amitaro" />
                                    </div>
                                </>}
                                {settingVoice === "カスタマイズ" &&
                                    <div className="text-sm mt-4 pb-[26px]">
                                        <p className="mb-4">
                                            sbv2ファイルを用意することで、<br />自身のStyle-Bert-ViTS2 JP-Extraモデルを利用することができます。
                                        </p>
                                        <p>下記ディレクトリに、用意したsbv2ファイルを格納してください。</p>
                                        <div className="text-white bg-gray-600 select-auto max-w-fit mt-1 px-2 py-1 rounded-sm">/Applications/Lycoris.app/Contents/Resources/resources/style-bert-vits/models</div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="h-48"></div>
        </div >
    )
}

export { SettingsMain }