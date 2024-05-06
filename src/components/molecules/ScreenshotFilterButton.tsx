import { useRecoilState } from 'recoil'
import { speechFilterState } from '../../store/atoms/speechFilterState'

const ScreenshotFilterButton = (): JSX.Element => {
    const [filterTarget, setFilterTarget] = useRecoilState(speechFilterState)
    const click = () => {
        if (filterTarget === "screenshot") {
            setFilterTarget(null)
        } else {
            setFilterTarget("screenshot")
        }
    }

    return (
        <button className={`select-none badge badge-md gap-2 text-white border-none ${filterTarget === "screenshot" ? "bg-orange-900" : "bg-orange-400"}`} onClick={click}>
            <svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
                <polygon points="4,0 8,4 4,8 0,4" style={{ "fill": "white" }} />
            </svg>
            スクリーンショット
        </button>
    )
}

export { ScreenshotFilterButton }