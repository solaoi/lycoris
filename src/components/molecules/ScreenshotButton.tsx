import { invoke } from '@tauri-apps/api/tauri'
import { useRecoilValue } from 'recoil'
import { appWindowState } from '../../store/atoms/appWindowState'
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import { selectedNoteState } from '../../store/atoms/selectedNoteState';

type ScreenShotButtonProps = {
    hasPermissionScreenCapture: boolean,
}

const ScreenShotButton = (props: ScreenShotButtonProps): JSX.Element => {
    const { hasPermissionScreenCapture = false } = props
    const selectedNote = useRecoilValue(selectedNoteState)
    const targetWindow = useRecoilValue(appWindowState)
    const [disabled, setDisabled] = useState(false)
    useEffect(() => {
        if (targetWindow === null || !hasPermissionScreenCapture) {
            setDisabled(true)
        } else {
            setDisabled(false)
        }
    }, [targetWindow])

    const click = () => {
        setDisabled(true);
        invoke('screenshot_command', { windowId: targetWindow?.id, noteId: selectedNote!.note_id })
            .then(r => {
                const isSuccess = r as boolean
                if (!isSuccess) {
                    toast.error('スクリーンショットに失敗しました')
                }
                setDisabled(false)
            })
    }

    return (
        <button className="btn gap-2 glass border border-solid border-neutral-300 text-primary w-full" disabled={disabled} onClick={click}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M1 8a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 8.07 3h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 16.07 6H17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8Zm13.5 3a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
            </svg>
            スクリーンショット
        </button>
    )
}

export { ScreenShotButton }