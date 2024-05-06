export type SpeechHistoryType = {
    id? : number;
    speech_type: "speech" | "memo" | "screenshot";
    created_at_unixtime: number;
    content: string;
    wav: string;
    model: string;
    model_description: string;
    note_id: number;
}