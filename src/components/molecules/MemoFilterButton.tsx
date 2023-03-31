import { useRecoilState } from 'recoil'
import { memoFilterState } from '../../store/atoms/memoFilterState'

const MemoFilterButton = (): JSX.Element => {
    const [filterd, setFilterd] = useRecoilState(memoFilterState)
    const click = () => {
        setFilterd(!filterd)
    }

    return (
        <button className={`select-none badge badge-md gap-2 text-white border-none ${filterd ? "bg-orange-900" : "bg-orange-400"}`} onClick={click}>
            <svg width="8" height="8" viewBox="0, 0, 8, 8" xmlns="http://www.w3.org/2000/svg">
                <rect width="8" height="8" style={{ "fill": "white" }} />
            </svg>
            メモ
        </button>
    )
}

export { MemoFilterButton }