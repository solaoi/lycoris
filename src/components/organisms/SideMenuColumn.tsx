import { useEffect, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { featureState } from "../../store/atoms/featureState";
import { selectedNoteState } from "../../store/atoms/selectedNoteState";
import { NoteType } from "../../type/Note.type";
import { NoteDeleteButton } from "../molecules/NoteDeleteButton";

type SideMenuColumnProps = {
    note: NoteType
    deleteAction: () => void
    isAdded: boolean
    setAdded: (flag: boolean) => void
}

const SideMenuColumn = (props: SideMenuColumnProps): JSX.Element => {
    const { note, deleteAction, isAdded, setAdded } = props;
    const [selectedNote, setSelectedNote] = useRecoilState(selectedNoteState);
    const setFeature = useSetRecoilState(featureState);
    const [isHover, setHover] = useState(false);
    const [isDeleted, setDeleted] = useState(false);
    const animateAction = () => {
        setDeleted(true)
    }
    useEffect(() => {
        if (isAdded) {
            setSelectedNote({ ...note, note_id: note.id! })
        }
    }, [])

    return (
        <div
            className={(selectedNote?.note_id === note.id ? "bg-base-200" : "bg-white") + " flex justify-between cursor-pointer items-center select-none border-t h-20 p-5 hover:bg-base-300 break-all"}
            style={isDeleted ? {
                animation: "fadeOutUp .2s ease-out forwards"
            } : isAdded ? {
                animation: "fadeInDown .1s ease-in forwards"
            } : {}}
            onClick={() => {
                setFeature("note"); setAdded(false); setSelectedNote({ note_id: note.id!, note_title: note.note_title })
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <p>{note.note_title}</p>
            <NoteDeleteButton noteTitle={note.note_title} hidden={isHover} deleteAction={deleteAction} animateAction={animateAction} />
        </div>
    )
}

export { SideMenuColumn }