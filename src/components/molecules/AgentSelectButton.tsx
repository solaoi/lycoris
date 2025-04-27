import { useRef } from 'react';
import logo from "../../assets/lycoris-logo.png";
import { useRecoilState, useRecoilValue } from 'recoil';
import { settingKeyState } from '../../store/atoms/settingKeyState';
import { MultiSelect, Option } from "./MultiSelect";
import { recordState } from '../../store/atoms/recordState';
import { tracingState } from '../../store/atoms/tracingState';
import { Agent } from '../../type/Agent.type';
import { agentSelectedState } from '../../store/atoms/agentSelectedState';

type AgentSelectButtonProps = {
    agents: Agent[];
}

const AgentSelectButton = (props: AgentSelectButtonProps): JSX.Element => {
    const { agents } = props;
    const isRecording = useRecoilValue(recordState);
    const isTracing = useRecoilValue(tracingState);
    const settingKeyOpenai = useRecoilValue(settingKeyState("settingKeyOpenai"));
    const isOpenaiKeySet = settingKeyOpenai !== "";
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [agentSelected, setAgentSelected] = useRecoilState(agentSelectedState);
    const handleChange = (selected: Option[]) => {
        setAgentSelected(selected.map(option => option.value));
    };

    return (
        <>
            <button className={`btn bg-white border border-solid border-neutral-300 text-[#2cc440] group transition-all duration-300 ease-in-out w-14 hover:w-40 flex items-center justify-center relative ${(isOpenaiKeySet && agents.length > 0) ? "" : "hidden"}`}
                onClick={((e) => {
                    e.stopPropagation();
                    dialogRef.current?.showModal();
                })}
                disabled={!isOpenaiKeySet || isRecording || isTracing}>
                <img src={logo} alt="select agent" className='w-6 absolute left-1/2 -translate-x-1/2 group-hover:left-6 transition-all duration-300' />
                <span className="opacity-0 group-hover:opacity-100 transition-[opacity] duration-300 ease-in whitespace-nowrap ml-8">エージェント選択</span>
                <div className={`badge absolute top-[-6px] right-[-12px] ${agentSelected.length === 0 ? "hidden" : ""}`}>{agentSelected?.length}</div>
            </button>
            <dialog
                ref={dialogRef}
                className="modal cursor-default"
                onClick={e => {
                    e.stopPropagation();
                    if (e.target === dialogRef.current) {
                        dialogRef.current?.close();
                    }
                }}
            >
                <div className="modal-box w-[780px] overflow-y-visible">
                    <h3 className="font-bold text-lg">エージェントの選択</h3>
                    <div className="mt-8">
                        <MultiSelect
                            labelName="エージェント"
                            options={agents.map(agent => ({ value: agent.name, label: agent.name }))}
                            onChange={handleChange}
                            value={agentSelected.map(agent => ({ value: agent, label: agent }))}
                            isSelectAll={true}
                            menuPlacement={"bottom"}
                            onBlur={() => {

                            }}
                        />
                    </div>
                    <div className="modal-action mt-8">
                        <form method="dialog">
                            <button className="btn">OK</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    )
}

export { AgentSelectButton }