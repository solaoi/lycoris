import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAudioDevices } from "../../hooks/useAudioDevices"
import { useRecoilValue, useRecoilState } from 'recoil';
import { audioDeviceState } from "../../store/atoms/audioDeviceState";
import { desktopAudioState } from "../../store/atoms/desktopAudioState";
import { recordState } from '../../store/atoms/recordState';
import { useHasPermissionMicrophone } from "../../hooks/useHasPermissionMicrophone";
import { useHasPermissionScreenCapture } from "../../hooks/useHasPermissionScreenCapture";

const AudioDevices = (): JSX.Element => {
    const [audioDevice, setAudioDevice] = useRecoilState(audioDeviceState)
    const isRecording = useRecoilValue(recordState)
    const [hasDesktopAudio, setHasDesktopAudio] = useRecoilState(desktopAudioState)

    const [showAudioSource, setShowAudioSource] = useState<boolean>(false)
    const audioDevices = useAudioDevices(showAudioSource)

    const [isDesktopAudioToggled, setIsDesktopAudioToggled] = useState<boolean | null>(null)
    const hasPermissionScreenCapture = useHasPermissionScreenCapture(isDesktopAudioToggled)
    const [isAudioToggled, setIsAudioToggled] = useState<boolean | null>(null)
    const hasPermissionMicrophone = useHasPermissionMicrophone(isAudioToggled)

    const dropdownRef = useRef<HTMLLabelElement>(null);
    const checkboxRecordDesktopRef = useRef<HTMLInputElement>(null);
    const checkboxRecordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setHasDesktopAudio(!checkboxRecordDesktopRef.current!.checked && hasPermissionScreenCapture)
    }, [hasPermissionScreenCapture])

    const changeHasDesktopAudio = (e: ChangeEvent<HTMLInputElement>) => {
        dropdownRef.current?.focus();
        setIsDesktopAudioToggled(!isDesktopAudioToggled)
        if (hasPermissionScreenCapture) {
            setHasDesktopAudio(e.target.checked)
        }
    }

    useEffect(() => {
        if (checkboxRecordRef.current) {
            if (!checkboxRecordRef.current.checked && hasPermissionMicrophone) {
                setShowAudioSource(!checkboxRecordRef.current.checked && hasPermissionMicrophone)
            }
        }
    }, [hasPermissionMicrophone])

    const changeAudioSource = (e: ChangeEvent<HTMLInputElement>) => {
        dropdownRef.current?.focus();
        setIsAudioToggled(!isAudioToggled)
        if (hasPermissionMicrophone) {
            setShowAudioSource(e.target.checked)
            if (!e.target.checked) {
                setAudioDevice(null)
            }
        }
    }

    const checkAndCloseDropDown = (target: EventTarget & HTMLLabelElement) => {
        if (target && target.matches(':focus')) {
            setTimeout(() => target.blur(), 0);
        }
    }

    const change = (e: ChangeEvent<HTMLInputElement>) => {
        dropdownRef.current?.focus();
        if (e.target.checked) {
            const deviceLabel = e.target.value
            setAudioDevice(deviceLabel)
        }
    }

    const validAudioDevice = (hasDesktopAudio: boolean, audioDevice: string | null) => {
        if (hasDesktopAudio) {
            if (audioDevice === null) {
                return <span className="inline-flex items-center w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                        <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.105a3.501 3.501 0 0 0 1.1 1.677A.75.75 0 0 1 13.26 18H6.74a.75.75 0 0 1-.484-1.323A3.501 3.501 0 0 0 7.355 15H4.25A2.25 2.25 0 0 1 2 12.75v-8.5Zm1.5 0a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75v-7.5Z" clipRule="evenodd" />
                    </svg>
                    <span className="w-full overflow-x-hidden whitespace-nowrap text-ellipsis">デスクトップ音声</span>
                </span>
            }
            return <span className="inline-flex items-center w-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                    <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.105a3.501 3.501 0 0 0 1.1 1.677A.75.75 0 0 1 13.26 18H6.74a.75.75 0 0 1-.484-1.323A3.501 3.501 0 0 0 7.355 15H4.25A2.25 2.25 0 0 1 2 12.75v-8.5Zm1.5 0a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75v-7.5Z" clipRule="evenodd" />
                </svg>
                <span className="w-full overflow-x-hidden whitespace-nowrap text-ellipsis">{audioDevice}</span>
            </span>
        }
        if (audioDevice === null) {
            return <>利用する音源を選択</>
        }
        return <>{audioDevice}</>
    }

    return (
        <div className="dropdown">
            {isRecording ? <label tabIndex={0} className="group normal-case btn w-52 flex justify-between btn-disabled" style={{ color: "inherit", backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}>
                <div className="w-36 text-left overflow-x-hidden whitespace-nowrap text-ellipsis">{validAudioDevice(hasDesktopAudio, audioDevice)}</div>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="opacity-0 w-24 invisible rounded text-[12px] 
                        font-bold text-white py-1 bg-slate-600 top-12 left-4
                        group-hover:visible opacity-100 absolute">利用する音源
                </div>
            </label> : <label ref={dropdownRef} onMouseDown={e => checkAndCloseDropDown(e.currentTarget)} tabIndex={0} className="group normal-case btn w-52 flex justify-between" style={{ color: "inherit", backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}
            >
                <div className="w-36 text-left overflow-x-hidden whitespace-nowrap text-ellipsis">{validAudioDevice(hasDesktopAudio, audioDevice)}</div>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="opacity-0 w-24 invisible rounded text-[12px] 
                        font-bold text-white py-1 bg-slate-600 top-12 left-4
                        group-hover:visible opacity-100 absolute ">利用する音源
                </div>
            </label>}
            <ul tabIndex={0} className="dropdown-content menu rounded-box"
                style={{ backgroundColor: "hsl(var(--b1) / var(--tw-bg-opacity))", border: "1px solid hsl(var(--bc) / 0.2)" }}
            >
                <li>
                    <div className="bg-inherit">
                        <label className="cursor-pointer label">
                            <span className="label-text inline-flex">
                                <span className="mr-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.105a3.501 3.501 0 0 0 1.1 1.677A.75.75 0 0 1 13.26 18H6.74a.75.75 0 0 1-.484-1.323A3.501 3.501 0 0 0 7.355 15H4.25A2.25 2.25 0 0 1 2 12.75v-8.5Zm1.5 0a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75v-7.5Z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                <p className="w-32">デスクトップ音声</p>
                            </span>
                            <input type="checkbox" ref={checkboxRecordDesktopRef} className="toggle toggle-accent" checked={hasDesktopAudio} onChange={changeHasDesktopAudio} />
                        </label>
                    </div>
                </li>
                {audioDevices.length > 0 &&
                    <>
                        <hr />
                        <li>
                            <div className="bg-inherit">
                                <label className="cursor-pointer label">
                                    <span className="label-text inline-flex">
                                        <span className="mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                                                <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                                            </svg>
                                        </span>
                                        <p className="w-32">マイク音声</p>
                                    </span>
                                    <input type="checkbox" ref={checkboxRecordRef} className="toggle toggle-accent" checked={showAudioSource} onChange={changeAudioSource} />
                                </label>
                            </div>
                        </li>
                        {showAudioSource && <ul className="max-h-56 overflow-y-scroll rounded-box scrollbar-transparent"
                            style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                            {audioDevices.map((device, i) => (
                                <li key={"audio-device_" + i}>
                                    <label className="label inline-flex active:bg-inherit">
                                        <input type="radio" name="device-option" className="radio radio-accent" onChange={change} value={device.label} defaultChecked={audioDevice === device.label} />
                                        <a className="grow">{device.label}</a>
                                    </label>
                                </li>
                            ))}
                        </ul>}
                    </>}
            </ul>
        </div>
    )
}

export { AudioDevices }
