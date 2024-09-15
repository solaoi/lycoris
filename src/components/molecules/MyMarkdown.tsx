import Markdown from 'markdown-to-jsx'
import { useEffect, useRef, useState } from 'react'
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import { writeBinaryFile } from "@tauri-apps/api/fs";
import { save } from '@tauri-apps/api/dialog';
import html2canvas from 'html2canvas';
import { ControlledMenu, MenuItem } from '@szhsin/react-menu';
import clipboard from "tauri-plugin-clipboard-api";
import { PaperClip } from '../atoms/PaperClip';
import { Download } from '../atoms/Download';
import { selectedNoteState } from '../../store/atoms/selectedNoteState';
import { useRecoilValue } from 'recoil';

type MyMarkdownProps = {
    content: string
    title?: string
}

const MyMarkdown = (props: MyMarkdownProps) => {
    const { content, title = Date.now() } = props
    const rootRef = useRef<HTMLDivElement>(null);

    const [isOpen, setOpen] = useState(false);
    const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
    const [elementId, setElementId] = useState(0);

    const [contents, setContents] = useState<string[]>([]);

    const handleText = () => {
        clipboard.writeText(contents[elementId]);
    }
    const handleImage = async (type: "copy" | "download") => {
        const target = rootRef.current?.querySelectorAll("pre code")[elementId] as HTMLElement;
        const canvas = await html2canvas(target,
            {
                backgroundColor: null,
                onclone: (_, element) => {
                    element.style.setProperty("overflow-x", "unset");
                    element.style.setProperty("width", "fit-content");
                    if (!target.className.includes("mermaid")) {
                        element.style.backgroundColor = "#1a2638";
                    }
                }
            });
        if (type === "download") {
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob as Blob);
                }, 'image/png');
            });
            const arrayBuffer = await blob.arrayBuffer();
            const path = await save({ defaultPath: `${title}.png` });
            if (path) {
                const uint8Array = new Uint8Array(arrayBuffer);
                await writeBinaryFile({ path, contents: uint8Array });
            }
        } else if (type === "copy") {
            clipboard.writeImageBase64(canvas.toDataURL("image/png").split(';base64,')[1])
        }
    };

    useEffect(() => {
        mermaid.initialize({ startOnLoad: false });
        rootRef.current?.querySelectorAll('pre code').forEach(async (block, index) => {
            setContents(prev => [...prev, block.textContent! as string]);

            if (block.className.includes("mermaid")) {
                await mermaid.run({ nodes: [block as HTMLElement] });
                block.classList.add("hover:border-base-300", "border-2", "border-transparent", "rounded-lg", "cursor-pointer");
            } else {
                hljs.highlightBlock(block as HTMLElement);
            }
            (block as HTMLElement).addEventListener('contextmenu', (e) => {
                e.preventDefault();
                setAnchorPoint({ x: e.clientX, y: e.clientY });
                setElementId(index);
                setOpen(true);
            });
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
            <ControlledMenu
                anchorPoint={anchorPoint}
                state={isOpen ? 'open' : 'closed'}
                direction="right"
                onClose={() => setOpen(false)}
            >
                <MenuItem onClick={handleText}>
                    <PaperClip />
                    <p className='pl-2'>コピー</p>
                </MenuItem>
                <MenuItem onClick={() => handleImage("copy")}>
                    <PaperClip />
                    <p className='pl-2'>画像としてコピー</p>
                </MenuItem>
                <MenuItem onClick={() => handleImage("download")}>
                    <Download />
                    <p className='pl-2'>画像としてダウンロード</p>
                </MenuItem>
            </ControlledMenu>
        </div>
    )
}

export { MyMarkdown }