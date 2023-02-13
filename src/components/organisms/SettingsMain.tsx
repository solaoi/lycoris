import { ModelDownloadButton } from "../molecules/ModelDownloadButton"
import { ModelDownloadProgress } from "../molecules/ModelDownloadProgress"

const SettingsMain = (): JSX.Element => {
    return (
        <div className="p-5 overflow-auto" style={{ height: `calc(100vh - 64px)` }}>
            <h1 className="text-3xl">設定</h1>
            <div className="px-5">
                <h2 className="text-xl mt-5">認識精度</h2>
                <div className="px-5 mt-2">
                    <div className="mb-5">
                        <p>高精度の認識を行う場合には、下記言語パックをダウンロードしてください。</p>
                        <p>ただし、高精度なものほど認識に時間を要します。</p>
                    </div>
                    <div style={{ height: "82px" }}>
                        <div className="flex items-center mb-2">
                            <p>言語パック（精度：中）</p>
                            <ModelDownloadButton modelType="medium" />
                        </div>
                        <ModelDownloadProgress modelType="medium" />
                    </div>
                    <div>
                        <div className="flex items-center">
                            <p>言語パック（精度：高）</p>
                            <ModelDownloadButton modelType="large" />
                        </div>
                        <ModelDownloadProgress modelType="large" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export { SettingsMain }