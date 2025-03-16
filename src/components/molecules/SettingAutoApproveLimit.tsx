import { useRecoilState } from "recoil";
import { settingAutoApproveLimitState } from "../../store/atoms/settingAutoApproveLimitState";

const SettingAutoApproveLimit = (): JSX.Element => {
    const [autoApproveLimit, setAutoApproveLimit] = useRecoilState(settingAutoApproveLimitState);

    return (
        <div className="mb-4 text-gray-600">
            <div className="">
                <p className="font-bold mb-1">自動承認の回数制限</p>
                <div>
                    <p className="text-sm">各ツールの自動承認を有効化している場合に、連続自動承認ターン数を制限します。</p>
                    <p className="text-xs">※ 同じツールの同じ機能が連続3ターン自動承認された場合は、この設定によらず手動承認へ切替。</p>
                </div>
            </div>
            <div className="flex items-center my-4 h-4">
                {autoApproveLimit === 0 ? (
                    <p className="text-sm">回数制限なし</p>
                ) : (
                    <p className="text-sm"><span className="mx-2 text-xl">{autoApproveLimit}</span>回まで</p>
                )}
            </div>
            <input type="range"
                min={0} max={30} step={3}
                className="range range-accent"
                value={autoApproveLimit}
                onChange={(e) => {setAutoApproveLimit(parseInt(e.target.value))}} />
        </div>
    )
}

export { SettingAutoApproveLimit }