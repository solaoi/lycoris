import { ModelDownloadVoskButton } from "../molecules/ModelDownloadVoskButton"
import { ModelDownloadVoskProgress } from "../molecules/ModelDownloadVoskProgress"
import { ModelDownloadWhisperButton } from "../molecules/ModelDownloadWhisperButton"
import { ModelDownloadWhisperProgress } from "../molecules/ModelDownloadWhisperProgress"

const SettingsMain = (): JSX.Element => {
    return (
        <div className="p-5 overflow-auto" style={{ height: `calc(100vh - 64px)` }}>
            <h1 className="text-3xl flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                設定
            </h1>
            <div className="px-5">
                <h2 className="text-xl mt-5 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                    </svg>
                    話し手の言語
                </h2>
                <div className="px-5 mt-2">
                    <div className="mb-5">
                        <p>音声認識を行う対象言語の、言語パックをダウンロードしてください。</p>
                        <p>なお利用メモリが切迫している場合は、低容量版がオススメです。</p>
                    </div>
                    <div style={{ height: "86px" }}>
                        <div className="flex items-center justify-between mb-2">
                            <p>言語パック（日本語：低）</p>
                            <ModelDownloadVoskButton modelType="small-ja-0.22" />
                        </div>
                        <ModelDownloadVoskProgress modelType="small-ja-0.22" />
                    </div>
                    <div style={{ height: "86px" }}>
                        <div className="flex items-center justify-between mb-2">
                            <p>言語パック（日本語）</p>
                            <ModelDownloadVoskButton modelType="ja-0.22" />
                        </div>
                        <ModelDownloadVoskProgress modelType="ja-0.22" />
                    </div>
                    <div style={{ height: "86px" }}>
                        <div className="flex items-center justify-between mb-2">
                            <p>言語パック（英語：低）</p>
                            <ModelDownloadVoskButton modelType="small-en-us-0.15" />
                        </div>
                        <ModelDownloadVoskProgress modelType="small-en-us-0.15" />
                    </div>
                    <div style={{ height: "86px" }}>
                        <div className="flex items-center justify-between mb-2">
                            <p>言語パック（英語）</p>
                            <ModelDownloadVoskButton modelType="en-us-0.22" />
                        </div>
                        <ModelDownloadVoskProgress modelType="en-us-0.22" />
                    </div>
                </div>
            </div>
            <div className="px-5">
                <h2 className="text-xl mt-5 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    追っかけ文字起こし・翻訳
                </h2>
                <div className="px-5 mt-2">
                    <div className="mb-5">
                        <p>通常の文字起こしを追いかける形で、高精度で文字起こしや翻訳を行います。</p>
                        <p>下記言語パックをダウンロードするか、オンライン設定を行ってください。</p>
                    </div>
                    <div style={{ height: "86px" }}>
                        <div className="flex items-center justify-between mb-2">
                            <p>言語パック（精度：小）</p>
                            <ModelDownloadWhisperButton modelType="small" />
                        </div>
                        <ModelDownloadWhisperProgress modelType="small" />
                    </div>
                    <div style={{ height: "86px" }}>
                        <div className="flex items-center justify-between mb-2">
                            <p>言語パック（精度：中）</p>
                            <ModelDownloadWhisperButton modelType="medium" />
                        </div>
                        <ModelDownloadWhisperProgress modelType="medium" />
                    </div>
                    <div style={{ height: "86px" }}>
                        <div className="flex items-center justify-between mb-2">
                            <p>言語パック（精度：高）</p>
                            <ModelDownloadWhisperButton modelType="large" />
                        </div>
                        <ModelDownloadWhisperProgress modelType="large" />
                    </div>
                </div>
            </div>
            <div className="px-5">
                <h2 className="text-xl mt-5 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                    </svg>
                    オンライン設定
                </h2>
                <div className="px-5 mt-2">
                    <div className="mb-5">
                        <p>OpenAI社のAPIを利用することで、</p>
                        <p>高速な追っかけ文字起こし・翻訳や、要約機能及びカスタムメニューが有効となります。</p>
                        <p>（APIの利用に関しては、OpenAI社の利用規約を参照ください。）</p>
                    </div>
                    <div className="flex items-center">
                        <p className="mr-10">APIキー</p>
                        <input type="text" placeholder="xx-XXXXXXXXXXXXXXXXXXXXXXXX" className="input input-bordered focus:outline-none flex-1" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export { SettingsMain }