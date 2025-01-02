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
                <div className="bg-base-100 flex items-center justify-center select-none text-xl h-[48px]">
                    <button type="button" className="bg-base-200 hover:bg-base-300 focus:outline-none rounded-lg px-2 py-1"
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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                        </svg>
                    </button>
                    <div className="relative ml-2">
                        <input id="title-search" type="text" placeholder="タイトル検索..." className="input input-bordered focus:outline-none h-8" value={searchWord} onChange={e => setSearchWord(e.target.value)} />
                        <label htmlFor="title-search">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-6 absolute top-1 right-2">
                                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                            </svg>
                        </label>
                    </div>
                </div>
                <div className="overflow-auto" style={{ height: `calc(100vh - 112px)` }} >
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