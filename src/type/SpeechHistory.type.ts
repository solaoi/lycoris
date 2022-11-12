export type SpeechHistoryType = {
    id? : number
    speech_type: "speech" | "memo"
    unix_time: number
    content: string
    wav: string
    model: "manual" | "vosk" | "whisper-tiny" | "whisper-base" |  "whisper-small" |  "whisper-medium"  
}