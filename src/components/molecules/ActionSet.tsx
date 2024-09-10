import { useRef, useState } from "react"

const ActionSet = (): JSX.Element => {
    const dropdownRef = useRef<HTMLLabelElement>(null)

    const [targetAction, setTargetAction] = useState<string | null>("チャット")
    const actions = ["チャット"]
    const [toggle, setToggle] = useState(false)

    const change = (actionName: string) => {
        setTargetAction(actionName)
    }

    const checkAndCloseDropDown = (target: EventTarget & HTMLLabelElement) => {
        setToggle(!toggle)
        if (target && target.matches(':focus')) {
            setTimeout(() => target.blur(), 0);
        }
    }

    return (
        <div className="dropdown dropdown-top">
            <label ref={dropdownRef} onMouseDown={e => checkAndCloseDropDown(e.currentTarget)} tabIndex={0} className="group normal-case btn w-52 flex justify-between" style={{ color: "inherit", backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}
            >
                <div className="w-36 text-left overflow-x-hidden whitespace-nowrap text-ellipsis">{(targetAction === null) ? "アクションを選択" : `${targetAction}`}</div>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="opacity-0 w-28 invisible rounded text-[12px] 
                    font-bold text-white py-1 bg-slate-600 top-[-1.25rem] left-4 z-10
                    group-hover:visible opacity-100 absolute">利用するアクション
                </div>
            </label>
            <ul tabIndex={0} className="dropdown-content menu rounded-box w-52 bg-white"
                style={{ backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}
            >
                <ul className="max-h-56 overflow-y-scroll rounded-box scrollbar-transparent">
                    {actions.map((action, i) => (
                        <li key={"action_" + i}>
                            <label className="label inline-flex active:!bg-inherit">
                                <input className="radio radio-accent" type="radio" name={"action-input_" + i} checked={action === targetAction} value={action} onChange={() => change(action)} />
                                <a className="grow">{action}</a>
                            </label>
                        </li>
                    ))}
                </ul>
            </ul>
        </div>
    )
}

export { ActionSet }
