import { useRecoilState } from 'recoil'
import { speechFilterState } from '../../store/atoms/speechFilterState'

const MemoFilterButton = (): JSX.Element => {
    const [filterTarget, setFilterTarget] = useRecoilState(speechFilterState)
    const click = () => {
        if (filterTarget === "memo") {
            setFilterTarget(null)
        } else {
            setFilterTarget("memo")
        }
    }

    return (
        <button className={`select-none badge badge-md gap-2 text-white border-none ${filterTarget === "memo" ? "bg-orange-900" : "bg-orange-400"}`} onClick={click}>
            <svg width="8" height="8" viewBox="0, 0, 8, 8" xmlns="http://www.w3.org/2000/svg">
                <rect width="8" height="8" style={{ "fill": "white" }} />
            </svg>
            メモ
        </button>
    )
}

export { MemoFilterButton }