import { convertFileSrc } from '@tauri-apps/api/tauri';
import Zoom from 'react-medium-image-zoom'

type ScreenshotProps = {
    content: string
    date: string
}

const Screenshot = (props: ScreenshotProps): JSX.Element => {
    const { content, date } = props

    return (
        <div className={"flex mb-1 "}>
            <div className="w-16 pl-2 flex-none">{date}</div>
            <div style={{ paddingTop: "0.5rem", paddingRight: "10px" }}>
                <svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="4,0.4 7.6,4 4,7.6 0.4,4" opacity="0.6" />
                </svg>
            </div>
            <div className="pr-2 pb-4">
                <Zoom>
                    <img className="w-1/2" src={convertFileSrc(content)} alt="screenshot" />
                </Zoom>
            </div>
        </div>
    )
}

export { Screenshot }