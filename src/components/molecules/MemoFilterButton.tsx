import { useRecoilState } from 'recoil'
import { memoFilterState } from '../../store/atoms/memoFilterState'

const MemoFilterButton = (): JSX.Element => {
    const [filterd, setFilterd] = useRecoilState(memoFilterState)
    const click = () => {
        setFilterd(!filterd)
    }

    return (
        <button className={`badge badge-md gap-2 text-white border-none ${filterd ? "bg-orange-900" : "bg-orange-400"}`} onClick={click}>
            メモのみ表示
        </button>
    )
}

export { MemoFilterButton }