import Markdown from 'markdown-to-jsx'

type MyMarkdownProps = {
    content: string
}

const MyMarkdown = (props: MyMarkdownProps) => {
    const { content } = props
    return (
        <Markdown
            options={{
                forceBlock: true,
                overrides: {
                    a: ({ children, ...props }) => <a {...props} target="_blank">{children}</a>,
                    p: ({ children, ...props }) => `${children}`.includes("[object Object]") ? <p {...props} >{children}</p> : `${children}`.split("\n").map(c => <p {...props} >{c}</p>)
                }
            }}>
            {content}
        </Markdown>
    )
}

export { MyMarkdown }