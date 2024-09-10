export type SpeechHistoryType = {
    id? : number;
    speech_type: "speech" | "memo" | "screenshot" | "action";
    created_at_unixtime: number;
    content: string;
    content_2?: string;
    wav: string;
    model: string;
    model_description: string;
    note_id: number;
}