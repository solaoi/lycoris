import logo from "../../assets/Square142x142Logo.png"

const LogoMain = (): JSX.Element => {
    return (
        <div className="flex justify-center items-center h-full">
            <a href="https://github.com/solaoi/lycoris" target="_blank">
                <div className="flex items-center">
                    <img className="mr-5" src={logo} width={120} height={120} />
                    <div>
                        <p className="font-bold text-3xl text-primary">Lycoris</p>
                        <p className="font-semibold text-primary">Unleash the Power of AI</p>
                    </div>
                </div>
            </a>
        </div>
    )
}

export { LogoMain }