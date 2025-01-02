import { useEffect, useState } from "react";
import logo from "../../assets/Square142x142Logo.png"
import { getVersion } from "@tauri-apps/api/app";

const LogoMain = (): JSX.Element => {
    const [appVersion, setAppVersion] = useState<string | null>(null);
    useEffect(() => {
        const fetchVersion = async () => {
            const version = await getVersion();
            setAppVersion(version);
        };
        fetchVersion();
    }, []);

    return (
        <div className="flex justify-center items-center h-full select-none">
            <a href="https://github.com/solaoi/lycoris" target="_blank">
                <div className="flex items-center">
                    <img className="mr-5" src={logo} width={120} height={120} />
                    <div>
                        <div className="flex items-baseline">
                            <p className="font-bold text-3xl text-primary">Lycoris</p>
                            <p className="text-xs text-slate-500 pl-2">v{appVersion}</p>
                        </div>
                        <p className="font-semibold text-primary">Unleash the Power of AI</p>
                    </div>
                </div>
            </a>
        </div>
    )
}

export { LogoMain }