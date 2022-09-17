import { useRef, KeyboardEvent } from 'react'
import { useRecoilState } from 'recoil'
import { speechHistoryState } from '../../atoms/speechHistoryState'

const Footer = (): JSX.Element => {
    const inputEl = useRef<HTMLInputElement>(null)
    const [_, setHistories] = useRecoilState(speechHistoryState)
    const click = () => {
        setHistories(prev => {
            return [...prev, { type: "memo", date: new Date(), content: inputEl.current?.value || "" }]
        })
        if (inputEl.current) {
            inputEl.current.value = ""
        }
    }
    const enter = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!(e.key === "Enter" && e.keyCode === 13)) {
            return
        }
        setHistories(prev => {
            return [...prev, { type: "memo", date: new Date(), content: inputEl.current?.value || "" }]
        })
        if (inputEl.current) {
            inputEl.current.value = ""
        }
    }

    return (
        <footer className="fixed bottom-0 w-full max-w-7xl py-3 px-4 sm:px-6 lg:px-8 bg-white shadow flex justify-center">
            <div className="form-control basis-2/3">
                <div className="input-group">
                    <button className="btn btn-square flex-none btn-outline border-base-300 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" onClick={click} >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                    </button>
                    <input ref={inputEl} type="text" placeholder="メモ…" className="input input-bordered focus:outline-none flex-1" onKeyDown={e => enter(e)} />
                </div>
            </div>
        </footer>
    )
}

export { Footer }