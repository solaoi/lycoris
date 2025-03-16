import { useRecoilState } from "recoil";
import { settingSurveyToolEnabledState } from "../../store/atoms/settingSurveyToolEnabledState";

const SettingSurveyToolEnabled = (): JSX.Element => {
    const [surveyToolEnabled, setSurveyToolEnabled] = useRecoilState(settingSurveyToolEnabledState);

    return (
        <div className="flex items-center">
            <div className="font-bold text-gray-600 mr-2">
                <label className="cursor-pointer label">
                    <span className="label-text inline-flex mr-2 w-20">
                        <p className="text-base-content/40">アンケート</p>
                    </span>
                    <input type="checkbox"
                        className="toggle toggle-accent"
                        checked={surveyToolEnabled === 1}
                        onChange={(e) => {
                            setSurveyToolEnabled(e.target.checked ? 1 : 0);
                        }}
                    />
                </label>
            </div>
        </div>
    )
}

export { SettingSurveyToolEnabled }