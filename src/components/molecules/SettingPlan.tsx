import { useRecoilState } from 'recoil';
import { settingPlanState } from "../../store/atoms/settingPlanState";

const SettingPlan = (): JSX.Element => {
    const [settingPlan, setSettingPlan] = useRecoilState(settingPlanState)

    const change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { target } = e;
        if (target.checked) {
            setSettingPlan("pro")
        } else {
            setSettingPlan("free")
        }
    }

    return (
        <div className="flex items-center mb-4">
            <p className="w-[8rem]">契約プラン</p>
            <label htmlFor="plan-toggle" className="inline-flex items-center rounded cursor-pointer">
                <input id="plan-toggle" type="checkbox" className="hidden peer" onChange={change} checked={settingPlan === "pro"} />
                <span className="border text-sm px-4 py-1 rounded-l bg-base-300 peer-checked:bg-inherit">Free</span>
                <span className="border text-sm px-4 py-1 rounded-r peer-checked:bg-base-300">Pro</span>
            </label>
        </div>
    )
}

export { SettingPlan }
