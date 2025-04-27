import { AgentWorkspaceType } from "../../type/AgentWorkspace.type"
import { MyMarkdown } from "./MyMarkdown"

type AgentWorkspaceProps = {
    note_title: string
    agent_id: number
    workspaces: AgentWorkspaceType[]
}

const AgentWorkspace = (props: AgentWorkspaceProps): JSX.Element => {
    const { agent_id, workspaces = [], note_title } = props
    return (
        <div>
            {workspaces
                .filter(c => c.agent_id === agent_id)
                .map(c => {
                    return (
                        <MyMarkdown content={c.content || ""} title={`${note_title.trim()}_workspace_${c.id}`} />
                    )
                })}
        </div>)
}

export { AgentWorkspace }
