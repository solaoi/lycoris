export type Agent = {
    id: number;
    name: string;
    has_workspace: number;
    mode: number;
    role_prompt: string;
    tool_list: string[];
}