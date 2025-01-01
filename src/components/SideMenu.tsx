import { invoke } from "@tauri-apps/api"
import { listen } from "@tauri-apps/api/event"
import { useEffect, useRef, useState } from "react"
import { useRecoilState } from "recoil"
import { notesState } from "../store/atoms/notesState"
import { selectedNoteState } from "../store/atoms/selectedNoteState"
import { DeleteCompletionType } from "../type/DeleteCompletion.type"
import { SideMenuColumn } from "./organisms/SideMenuColumn"

const KatakanaToHiragana = (katakanaValue: string | null | undefined): string => {
    if (!katakanaValue) {
        return '';
    }

    return katakanaValue.replace(/[\u30a1-\u30f6]/g, (substring: string): string => {
        const hiraganaCharCode: number = substring.charCodeAt(0) - 0x60;
        return String.fromCharCode(hiraganaCharCode);
    });
}

const SideMenu = (): JSX.Element => {
    const targetRef = useRef<HTMLDivElement>(null);
    const [searchWord, setSearchWord] = useState("");
    const [notes, setNotes] = useRecoilState(notesState);
    const [isAdded, setAdded] = useState(false);
    const [selectedNote, setSelectedNote] = useRecoilState(selectedNoteState);
    useEffect(() => {
        if (!notes[notes.length - 1]?.id) {
            setAdded(true)
            targetRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [notes]);
    useEffect(() => {
        const unlisten = listen('deleteCompletion', event => {
            const d = event.payload as DeleteCompletionType
            if (d.is_finished) {
                setNotes(prev => prev.filter(note => note.id !== d.note_id))
                if (selectedNote?.note_id === d.note_id) {
                    setSelectedNote(null);
                }
            }
        })
        return () => {
            unlisten.then(f => f());
        }
    }, [selectedNote])
    const deleteAction = (note_id: number) => () => {
        setAdded(false);
        invoke('delete_note_command', { noteId: note_id });
    }
    return (
        <div className="flex justify-between border-r bg-base-100" style={{ width: "320px", flexFlow: "column", height: `calc(100vh - 64px)` }}>
            <div className="flex" style={{ flexFlow: "column" }}>
                <div className="bg-white flex items-center justify-center select-none text-xl" style={{ height: "64px" }}>
                    <input type="text" placeholder="タイトル検索..." className="input input-bordered focus:outline-none" value={searchWord} onChange={e => setSearchWord(e.target.value)} />
                    <button type="button" className="bg-base-200 hover:bg-base-300 focus:outline-none rounded-lg px-5 m-1"
                        style={{ height: "48px" }}
                        onClick={() => {
                            setNotes(prev => {
                                const today = new Date();
                                const note_title = today
                                    .toLocaleDateString("ja-JP", {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit"
                                    })
                                    .split("/")
                                    .join("-") + " ";
                                return [...prev, { note_title }]
                            });
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    </button>
                </div>
                <div className="overflow-auto" style={{ height: `calc(100vh - 128px)` }} >
                    <div ref={targetRef} />
                    {notes.filter(note => {
                        if (searchWord === "") {
                            return true;
                        }
                        return KatakanaToHiragana(note.note_title.toLowerCase()).includes(KatakanaToHiragana(searchWord.toLowerCase()))
                    }).map((note, i) => {
                        return (
                            <SideMenuColumn key={`note_${note.id}`} note={note} deleteAction={deleteAction(note.id!)} isAdded={i === 0 ? isAdded : false} setAdded={setAdded} />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export { SideMenu }