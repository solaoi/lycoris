export type AgentHistoryType = {
    id? : number;
    created_at_unixtime: number;
    content: string;
    speech_id: number;
    agent_id: number;
    note_id: number;
}