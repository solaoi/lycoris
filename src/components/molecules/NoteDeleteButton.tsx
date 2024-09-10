import { useEffect, useRef, useState } from "react"

type NoteDeleteProps = {
    hidden: boolean
    noteTitle: string
    animateAction: () => void
    deleteAction: () => void
}

const NoteDeleteButton = (props: NoteDeleteProps): JSX.Element => {
    const { hidden = true, noteTitle, deleteAction, animateAction } = props;
    const [timerId, setTimerId] = useState<number | null>(null);
    useEffect(() => {
        return () => {
            if (timerId !== null) { clearTimeout(timerId) }
        }
    }, []);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const click = () => {
        animateAction();
        const id = window.setTimeout(() => {
            deleteAction();
        }, 200);
        setTimerId(id);
    }

    return (
        <>
            <button className={(hidden ? "" : "hidden ") + "btn gap-2 glass border border-solid border-neutral-300 text-secondary animate-spread hover:bg-white"} onClick={((e) => {
                e.stopPropagation();
                dialogRef.current?.showModal();
            })}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                </svg>
            </button>
            <dialog ref={dialogRef} className="modal cursor-default" onClick={e => e.stopPropagation()}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg">{noteTitle}の削除</h3>
                    <p className="py-4">この<span className="font-semibold">{noteTitle}</span>を削除しますか？ この操作は元に戻せません。</p>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn mr-2">キャンセル</button>
                            <button className="btn text-secondary" onClick={click}>削除</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </>
    )
}

export { NoteDeleteButton }