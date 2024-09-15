import Markdown from 'markdown-to-jsx'
import { useEffect, useRef } from 'react'
import hljs from 'highlight.js';
import mermaid from 'mermaid';

type MyMarkdownProps = {
    content: string
}

const MyMarkdown = (props: MyMarkdownProps) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const { content } = props

    useEffect(() => {
        mermaid.initialize({ startOnLoad: false });
        rootRef.current?.querySelectorAll('pre code').forEach(async (block) => {
            if (block.className.includes("mermaid")) {
                await mermaid.run({ nodes: [block as HTMLElement] });
            } else {
                hljs.highlightBlock(block as HTMLElement);
            }
        });
    }, [content]);

    return (
        <div ref={rootRef} className='znc w-full'>
            <Markdown
                options={{
                    forceBlock: true,
                    overrides: {
                        a: ({ children, ...props }) => <a {...props} target="_blank">{children}</a>,
                        p: ({ children, ...props }) => `${children}`.includes("[object Object]") ? <p {...props} >{children}</p> : `${children}`.split("\n").map(c => <p {...props} >{c}</p>),
                    }
                }}>
                {content}
            </Markdown>
        </div>
    )
}

export { MyMarkdown }