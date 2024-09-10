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
            <div className="pr-2 pb-4 ml-5">
                <Zoom>
                    <img className="w-2/3" src={convertFileSrc(content)} alt="screenshot" />
                </Zoom>
            </div>
        </div>
    )
}

export { Screenshot }