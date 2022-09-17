export type SpeechHistoryType = {
    id? : number
    speech_type: "speech" | "memo"
    unix_time: number
    content: string
}