import { invoke } from "@tauri-apps/api"
import { ChangeEvent, useEffect, useRef, useState } from "react"
import { useRecoilState } from "recoil"
import { AppWindowType } from "../../type/AppWindow.type"
import { appWindowState } from "../../store/atoms/appWindowState"
import { useHasPermissionScreenCapture } from "../../hooks/useHasPermissionScreenCapture"
import { ScreenShotButton } from "./ScreenshotButton"

const AppWindow = (): JSX.Element => {
    const [isDesktopAudioToggled, setIsDesktopAudioToggled] = useState<boolean | null>(null)
    const hasPermissionScreenCapture = useHasPermissionScreenCapture(isDesktopAudioToggled)

    const dropdownRef = useRef<HTMLLabelElement>(null)

    const [targetApp, setTargetApp] = useState<string | null>(null)
    const [apps, setApps] = useState<string[]>([])
    const [toggle, setToggle] = useState(false)
    useEffect(() => {
        invoke('list_apps_command').then(apps => setApps(apps as string[]))
    }, [toggle])

    const [targetWindow, setTargetWindow] = useRecoilState(appWindowState)
    const [appWindows, setAppWindows] = useState<AppWindowType[]>([])
    const change = (e: ChangeEvent<HTMLInputElement>) => {
        dropdownRef.current?.focus();
        if (e.target.checked) {
            const appWindowId = e.target.value
            const targetAppWindow = appWindows.filter(({ id }) => id === parseInt(appWindowId))[0]
            setTargetWindow(targetAppWindow)
        }
    }
    const click = (appName: string) => {
        setTargetApp(appName)
        invoke('list_app_windows_command', { appName })
            .then(windows => setAppWindows(windows as AppWindowType[]))
    }

    const checkAndCloseDropDown = (target: EventTarget & HTMLLabelElement) => {
        setToggle(!toggle)
        if (target && target.matches(':focus')) {
            setTimeout(() => target.blur(), 0);
        }
    }

    return (<>
        <div className="dropdown dropdown-top" onClick={() =>
            setIsDesktopAudioToggled(!isDesktopAudioToggled)
        }>
            <label ref={dropdownRef} onMouseDown={e => checkAndCloseDropDown(e.currentTarget)} tabIndex={0} className="group normal-case btn w-52 flex justify-between" style={{ color: "inherit", backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}
            >
                <div className="w-36 text-left overflow-x-hidden whitespace-nowrap text-ellipsis">{targetWindow === null ? "撮影する画面を選択" : `${targetApp} / ${targetWindow.title}`}</div>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="opacity-0 w-24 invisible rounded text-[12px] 
                    font-bold text-white py-1 bg-slate-600 top-[-1.25rem] left-4 z-10
                    group-hover:visible opacity-100 absolute">撮影する画面
                </div>
            </label>
            {hasPermissionScreenCapture && <div tabIndex={0} className="p-0 dropdown-content menu rounded-box w-[15.5rem] bg-white join join-vertical"
                style={{ backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}
            >
                <div className="max-h-80 overflow-y-scroll rounded-box scrollbar-transparent w-full">
                    {apps.map((app, i) => (
                        <div key={"app_" + i} className={"collapse collapse-arrow join-item" + (app === targetApp ? " bg-base-200" : "")}>
                            {app === targetApp}
                            <input className="w-full" type="radio" name={"app-window_" + i} checked={app === targetApp} value={app} onChange={() => click(app)} />
                            <div className="collapse-title font-medium w-[15.5rem]" style={{ overflowWrap: "anywhere" }}>
                                {app}
                            </div>
                            <div className="collapse-content flex flex-col w-[15.5rem]" style={{ overflowWrap: "anywhere" }}>
                                {appWindows.map(({ id, title }) => (
                                    <label key={"appWindow_" + id} className="label inline-flex active:!bg-inherit cursor-pointer">
                                        <input type="radio" name="app-window-option" className="radio radio-accent mr-2" onChange={change} value={id} defaultChecked={id === targetWindow?.id} />
                                        <a className="grow">{title}</a>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>}
        </div>
        <div className="h-2"></div>
        <ScreenShotButton hasPermissionScreenCapture={hasPermissionScreenCapture} /></>
    )
}

export { AppWindow }
