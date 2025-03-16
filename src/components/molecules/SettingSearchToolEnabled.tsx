import { useRecoilState } from "recoil";
import { settingSearchToolEnabledState } from "../../store/atoms/settingSearchToolEnabledState";

const SettingSearchToolEnabled = (): JSX.Element => {
    const [searchToolEnabled, setSearchToolEnabled] = useRecoilState(settingSearchToolEnabledState);

    return (
        <div className="flex items-center">
            <div className="font-bold text-gray-600 mr-2">
                <label className="cursor-pointer label">
                    <span className="label-text inline-flex mr-2 w-20">
                        <p className="text-base-content/40">WEB検索</p>
                    </span>
                    <input type="checkbox"
                        className="toggle toggle-accent"
                        checked={searchToolEnabled === 1}
                        onChange={(e) => {
                            setSearchToolEnabled(e.target.checked ? 1 : 0);
                        }}
                    />
                </label>
            </div>
        </div>
    )
}

export { SettingSearchToolEnabled }