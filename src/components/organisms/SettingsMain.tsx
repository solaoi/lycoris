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
import { ModelDownloadFugumtButton } from "../molecules/ModelDownloadFugumtButton"
import { ModelDownloadFugumtProgress } from "../molecules/ModelDownloadFugumtProgress"
import { ModelDownloadHonyaku13BButton } from "../molecules/ModelDownloadHonyaku13BButton"
import { ModelDownloadHonyaku13BProgress } from "../molecules/ModelDownloadHonyaku13BProgress"
import { SettingProcesses } from "../molecules/SettingProcesses"
import { SettingOnlines } from "../molecules/SettingOnlines"
import { SettingAmiVoiceLogging } from "../molecules/SettingAmiVoiceLogging"

const SettingsMain = (): JSX.Element => {
    const settingLanguage = useRecoilValue(settingLanguageState);
    const settingProcess = useRecoilValue(settingProcessState);
    const settingOnline = useRecoilValue(settingOnlineState);
    return (
        <div className="p-5 overflow-auto" style={{ height: `calc(100vh - 64px)` }}>
            <h1 className="text-3xl flex items-center select-none cursor-default">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                設定
            </h1>
            <div className="px-5 select-none cursor-default mt-8">
                <h2 className="text-xl mt-5 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                    </svg>
                    話し手の言語
                </h2>
                <div className="px-5">
                    <div className="mb-8">
                        <p>音声認識を行う対象の、言語パックをダウンロードしてください。</p>
                        <p>言語によっては、利用メモリが少ないライト版のみ存在します。</p>
                    </div>
                    <div className="mb-4 border-b">
                        <SettingLanguages />
                    </div>
                    {settingLanguage === "日本語" && <>
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
                        <div style={{ height: "86px" }}>
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
            <div className="px-5 select-none cursor-default">
                <h2 className="text-xl mt-5 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    追っかけ文字起こし・翻訳
                </h2>
                <div className="px-5">
                    <div className="mb-8">
                        <p>通常の文字起こしを追いかける形で、高精度の文字起こしや翻訳を行います。</p>
                        <p>各パックをダウンロードするか、オンライン設定を行ってください。</p>
                    </div>
                    <div className="mb-4 border-b">
                        <SettingProcesses />
                    </div>
                    {settingProcess === "文字起こし" && <>
                        <p className="text-sm mt-4 mb-4">汎用パック（高精度）を推奨します。速度に問題がある場合のみ、他を検討してください。</p>
                        <div style={{ height: "86px" }}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p>汎用パック（低精度）</p>
                                    <div className="flex my-1">
                                        <div className="badge bg-slate-400 text-white">whisper-small</div>
                                        <div className="badge bg-slate-400 text-white ml-1">610 MB</div>
                                    </div>
                                </div>
                                <ModelDownloadWhisperButton modelType="small" />
                            </div>
                            <ModelDownloadWhisperProgress modelType="small" />
                        </div>
                        <div style={{ height: "86px" }}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p>汎用パック（中精度）</p>
                                    <div className="flex my-1">
                                        <div className="badge bg-slate-400 text-white">whisper-medium</div>
                                        <div className="badge bg-slate-400 text-white ml-1">2.0 GB</div>
                                    </div>
                                </div>
                                <ModelDownloadWhisperButton modelType="medium" />
                            </div>
                            <ModelDownloadWhisperProgress modelType="medium" />
                        </div>
                        <div style={{ height: "86px" }}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p>汎用パック（高精度）</p>
                                    <div className="flex my-1">
                                        <div className="badge bg-slate-400 text-white">whisper-large-v3</div>
                                        <div className="badge bg-slate-400 text-white ml-1">4.0 GB</div>
                                    </div>
                                </div>
                                <ModelDownloadWhisperButton modelType="large" />
                            </div>
                            <ModelDownloadWhisperProgress modelType="large" />
                        </div>
                        <div style={{ height: "86px" }}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p>英語パック（速度優先）</p>
                                    <div className="flex my-1">
                                        <div className="badge bg-slate-400 text-white">distil-whisper/distil-large-v3</div>
                                        <div className="badge bg-slate-400 text-white ml-1">2.6 GB</div>
                                    </div>
                                </div>
                                <ModelDownloadWhisperButton modelType="large-distil.en" />
                            </div>
                            <ModelDownloadWhisperProgress modelType="large-distil.en" />
                        </div>
                        <div style={{ height: "86px" }}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p>日本語パック（速度優先）</p>
                                    <div className="flex my-1">
                                        <div className="badge bg-slate-400 text-white">Kotoba-Whisper-v1.1</div>
                                        <div className="badge bg-slate-400 text-white ml-1">2.6 GB</div>
                                    </div>
                                </div>
                                <ModelDownloadWhisperButton modelType="large-distil.ja" />
                            </div>
                            <ModelDownloadWhisperProgress modelType="large-distil.ja" />
                        </div>
                    </>}
                    {settingProcess === "翻訳" && <>
                        <p className="text-sm mt-4 mb-4">有効にするには、文字起こしの汎用パック（高精度）が必要です。<br/>英語への翻訳も、文字起こしの汎用パックが担います。</p>
                        <div style={{ height: "86px" }}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p>日本語パック（速度優先）</p>
                                    <div className="flex my-1">
                                        <div className="badge bg-slate-400 text-white">staka/fugumt-en-ja</div>
                                        <div className="badge bg-slate-400 text-white ml-1">114 MB</div>
                                    </div>
                                </div>
                                <ModelDownloadFugumtButton />
                            </div>
                            <ModelDownloadFugumtProgress />
                        </div>
                        <div style={{ height: "86px" }}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p>日本語パック（精度優先）</p>
                                    <div className="flex my-1">
                                        <div className="badge bg-slate-400 text-white">aixsatoshi/Honyaku-13b</div>
                                        <div className="badge bg-slate-400 text-white ml-1">7.1 GB</div>
                                    </div>
                                    <p className="text-sm">
                                        ※ 処理が重いため、リアルタイムでの利用は推奨しません。
                                    </p>
                                </div>
                                <ModelDownloadHonyaku13BButton />
                            </div>
                            <ModelDownloadHonyaku13BProgress />
                        </div>
                    </>}
                </div>
            </div>
            <div className="px-5 select-none cursor-default">
                <h2 className="text-xl mt-5 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                    </svg>
                    オンライン設定
                </h2>
                <div className="px-5">
                    <div className="mb-8">
                        <p>各利用したいAPIとの疎通設定を行ってください。</p>
                    </div>
                    <div className="mb-4 border-b">
                        <SettingOnlines />
                    </div>
                </div>
                <div className="pl-5">
                    {settingOnline === "OpenAI" && <>
                        <div className="mb-4 text-sm">
                            <p>OpenAI社のAPIを利用することで、</p>
                            <p>高速な追っかけ文字起こし・翻訳やAIが選択可能となります。</p>
                        </div>
                        <div className="mb-8">
                            <SettingKey settingName="settingKeyOpenai" />
                        </div>
                        <SettingModel />
                        <div className="mt-8 mb-4">
                            <p className="mb-2">AIオプション</p>
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
                            <p>AmiVoice社のAPIを利用することで、</p>
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
            <div className="h-48"></div>
        </div>
    )
}

export { SettingsMain }