import { appWindow } from "@tauri-apps/api/window"

import closeIcon from "../../assets/macos/Close.png"
import minimizeIcon from "../../assets/macos/Minimize.png"
import zoomIcon from "../../assets/macos/Zoom.png"

const MacosControls = (): JSX.Element => {
    return (
        <div className="flex p-[4px]">
            <img src={closeIcon} width={12} height={12} className="mr-[8px]" onClick={async () => await appWindow.close()} />
            <img src={minimizeIcon} width={12} height={12} className="mr-[8px]" onClick={async () => await appWindow.minimize()} />
            <img src={zoomIcon} width={12} height={12} onClick={async () => await appWindow.toggleMaximize()} />
        </div>
    )
}

export { MacosControls }