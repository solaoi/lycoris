import { AudioDevices } from "./molecules/AudioDevice"

const Header = (): JSX.Element => {
    return (
        <header className="sticky top-0" style={{ minWidth: "770px", height: "64px" }}>
            <div className="navbar bg-base-200">
                <div className="flex-1">
                    <a className="btn btn-ghost normal-case text-xl text-primary">Lycoris</a>
                </div>
                <div className="flex-none">
                    <AudioDevices />
                </div>
            </div>
        </header>
    )
}

export { Header }