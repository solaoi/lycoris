import { ModelDownloadVoskButton } from "../molecules/ModelDownloadVoskButton"
import { ModelDownloadVoskProgress } from "../molecules/ModelDownloadVoskProgress"
import { ModelDownloadWhisperButton } from "../molecules/ModelDownloadWhisperButton"
import { ModelDownloadWhisperProgress } from "../molecules/ModelDownloadWhisperProgress"

const SettingsMain = (): JSX.Element => {
    return (
        <div className="p-5 overflow-auto" style={{ height: `calc(100vh - 64px)` }}>
            <h1 className="text-3xl">設定</h1>
            <div className="px-5">
                <h2 className="text-xl mt-5">話し手の言語</h2>
                <div className="px-5 mt-2">
                    <div className="mb-5">
                        <p>音声認識を行う対象言語の言語パックをダウンロードしてください。</p>
                    </div>
                    <div style={{ height: "86px" }}>
                        <div className="flex items-center justify-between mb-2">
                            <p>言語パック（日本語）</p>
                            <ModelDownloadVoskButton modelType="ja" />
                        </div>
                        <ModelDownloadVoskProgress modelType="ja" />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p>言語パック（英語）</p>
                            <ModelDownloadVoskButton modelType="en-us" />
                        </div>
                        <ModelDownloadVoskProgress modelType="en-us" />
                    </div>
                </div>
            </div>
            <div className="px-5">
                <h2 className="text-xl mt-5">追っかけ高精度認識</h2>
                <div className="px-5 mt-2">
                    <div className="mb-5">
                        <p>追っかけ高精度認識を行う場合には、下記言語パックをダウンロードしてください。</p>
                        <p>ただし、高精度なものほど認識に時間を要します。</p>
                    </div>
                    <div style={{ height: "86px" }}>
                        <div className="flex items-center justify-between mb-2">
                            <p>言語パック（精度：中）</p>
                            <ModelDownloadWhisperButton modelType="medium" />
                        </div>
                        <ModelDownloadWhisperProgress modelType="medium" />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p>言語パック（精度：高）</p>
                            <ModelDownloadWhisperButton modelType="large" />
                        </div>
                        <ModelDownloadWhisperProgress modelType="large" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export { SettingsMain }