import { ChangeEvent } from "react";
import { useRecoilState } from 'recoil';
import { settingVoiceState } from "../../store/atoms/settingVoiceState";

const SettingVoices = (): JSX.Element => {
    const settingVoices = ["JVNV", "つくよみちゃん", "小春音アミ・あみたろ", "カスタマイズ"]
    const [settingVoice, setSettingVoice] = useRecoilState(settingVoiceState)

    const change = (e: ChangeEvent<HTMLSelectElement>) => {
        const settingVoice = e.target.value
        setSettingVoice(settingVoice)
    }

    return (
        <select className="select focus:outline-none pl-1 pr-0 w-44 bg-transparent" name="voices" onChange={change} >
            {settingVoices?.map((voice, i) => (
                <option key={"setting-process" + i} value={voice} selected={voice === settingVoice}>{voice}</option>
            ))}
        </select>
    )
}

export { SettingVoices }
