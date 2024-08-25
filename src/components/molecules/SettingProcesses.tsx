import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingProcessState } from "../../store/atoms/settingProcessState";

const SettingProcesses = (): JSX.Element => {
    const settingProcesses = ["文字起こし", "翻訳"]
    const [settingProcess, setSettingProcess] = useRecoilState(settingProcessState)

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const settingProcess = e.target.value
        setSettingProcess(settingProcess)
    }

    return (
        <select className="select focus:outline-none pl-1 pr-0 w-32" name="processes" onChange={change} >
            {settingProcesses?.map((process, i) => (
                <option key={"setting-process" + i} value={process} selected={process === settingProcess}>{process}</option>
            ))}
        </select>
    )
}

export { SettingProcesses }
