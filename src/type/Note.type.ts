export type NoteType = {
    id? : number;
    note_title: string;
    is_archived?: boolean;
    created_at_unixtime?: number;
}