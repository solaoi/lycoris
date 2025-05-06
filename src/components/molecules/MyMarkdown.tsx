import Markdown from 'markdown-to-jsx'
import { useEffect, useRef, useState } from 'react'
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import { writeFile } from "@tauri-apps/plugin-fs";
import { save } from '@tauri-apps/plugin-dialog';
import html2canvas from 'html2canvas';
import { ControlledMenu, MenuItem } from '@szhsin/react-menu';
import clipboard from "tauri-plugin-clipboard-api";
import { Download } from '../atoms/Download';
import { Photo } from '../atoms/Photo';
import { DocumentText } from '../atoms/DocumentText';
import { DocumentDuplicateFilled } from '../atoms/DocumentDuplicateFilled';

type MyMarkdownProps = {
    content: string
    title?: string
    minWidth?: string
}

const MyMarkdown = (props: MyMarkdownProps) => {
    const { content, title = Date.now(), minWidth } = props
    const rootRef = useRef<HTMLDivElement>(null);

    const [isOpen, setOpen] = useState(false);
    const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
    const [elementId, setElementId] = useState(0);

    const [contents, setContents] = useState<string[]>([]);

    const [isTableSelected, setIsTableSelected] = useState(false);
    const [tableId, setTableId] = useState(0);

    const [isTextSelected, setIsTextSelected] = useState(false);
    const [textSelected, setTextSelected] = useState("");
    const handleMouseDown = (e: MouseEvent) => {
        if (e.button === 2) {
            const selection = window.getSelection();
            setTextSelected(selection?.toString() || "");
            const isWithinSelectableArea = rootRef.current?.contains(selection?.anchorNode || null);
            setIsTextSelected((selection?.toString() || "").length > 0 && !!isWithinSelectableArea);
        }
    };
    useEffect(() => {
        document.addEventListener("mousedown", handleMouseDown);
        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
        }
    }, [handleMouseDown]);

    const handlePartialText = () => {
        clipboard.writeText(textSelected);
    }
    const handleText = () => {
        clipboard.writeText(contents[elementId]);
    }
    const handleImage = async (type: "copy" | "download") => {
        const target = (() => {
            if (isTableSelected) return rootRef.current?.querySelectorAll("table")[tableId] as HTMLElement;
            return rootRef.current?.querySelectorAll("pre code")[elementId] as HTMLElement;
        })();
        const canvas = await (async () => {
            if (isTableSelected) {
                return await html2canvas(target,
                    {
                        backgroundColor: null,
                        onclone: (_, element) => {
                            element.style.setProperty("overflow-x", "unset");
                            element.style.setProperty("width", "fit-content");
                        }
                    });
            } else {
                return await html2canvas(target,
                    {
                        backgroundColor: null,
                        onclone: (_, element) => {
                            element.style.setProperty("overflow-x", "unset");
                            if (!target.className.includes("mermaid")) {
                                element.style.backgroundColor = "#1a2638";
                                element.style.width = "unset";
                            }
                        }
                    });
            }
        })();
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
                await writeFile(path, uint8Array);
            }
        } else if (type === "copy") {
            clipboard.writeImageBase64(canvas.toDataURL("image/png").split(';base64,')[1])
        }
    };

    useEffect(() => {
        mermaid.initialize({ startOnLoad: false });
        const listeners = new Map();

        rootRef.current?.querySelectorAll('pre code').forEach(async (block, index) => {
            setContents(prev => [...prev, block.textContent! as string]);

            if (block.className.includes("mermaid")) {
                await mermaid.run({ nodes: [block as HTMLElement] });
            } else {
                hljs.highlightBlock(block as HTMLElement);
                block.classList.add("cursor-pointer", "w-full");
            }

            const handleContextMenu = (e: MouseEvent) => {
                e.preventDefault();
                setAnchorPoint({ x: e.clientX, y: e.clientY });
                setIsTableSelected(false);
                setElementId(index);
                setOpen(true);
            };

            (block as HTMLElement).addEventListener('contextmenu', handleContextMenu);
            listeners.set(block, ['contextmenu', handleContextMenu]);
        });

        rootRef.current?.querySelectorAll('table').forEach(async (block, index) => {
            block.classList.add("hover:border-base-300", "border-2", "border-transparent", "rounded-lg", "cursor-pointer", "!w-fit");

            const handleContextMenu = (e: MouseEvent) => {
                e.preventDefault();
                setAnchorPoint({ x: e.clientX, y: e.clientY });
                setIsTableSelected(true);
                setTableId(index);
                setOpen(true);
            };

            (block as HTMLElement).addEventListener('contextmenu', handleContextMenu);
            listeners.set(block, ['contextmenu', handleContextMenu]);
        });

        return () => {
            listeners.forEach(([event, listener], block) => {
                (block as HTMLElement).removeEventListener(event, listener);
            });
        };
    }, [content]);

    return (
        <div ref={rootRef} className='znc w-full select-auto' style={minWidth ? { minWidth, overflowWrap: "anywhere" } : { overflowWrap: "anywhere" }}>
            <Markdown
                options={{
                    disableParsingRawHTML: true,
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
                {isTextSelected ?
                    <>
                        <MenuItem onClick={handlePartialText} style={{margin: 0}}>
                            <DocumentDuplicateFilled />
                            <p className='pl-2'>コピー</p>
                        </MenuItem>
                    </> :
                    isTableSelected ?
                        <>
                            <MenuItem onClick={() => handleImage("copy")} style={{margin: 0}}>
                                <Photo />
                                <p className='pl-2'>画像としてコピー</p>
                            </MenuItem>
                            <MenuItem onClick={() => handleImage("download")} style={{margin: 0}}>
                                <Download />
                                <p className='pl-2'>画像としてダウンロード</p>
                            </MenuItem>
                        </> :
                        <>
                            <MenuItem onClick={handleText} style={{margin: 0}}>
                                <DocumentText />
                                <p className='pl-2'>テキストとしてコピー</p>
                            </MenuItem>
                            <MenuItem onClick={() => handleImage("copy")} style={{margin: 0}}>
                                <Photo />
                                <p className='pl-2'>画像としてコピー</p>
                            </MenuItem>
                            <MenuItem onClick={() => handleImage("download")} style={{margin: 0}}>
                                <Download />
                                <p className='pl-2'>画像としてダウンロード</p>
                            </MenuItem>
                        </>}
            </ControlledMenu>
        </div>
    )
}

export { MyMarkdown }
