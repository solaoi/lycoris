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
            <div className="w-16 pl-2 flex-none text-gray-500/60 text-sm flex content-start pt-[0.15rem]">{date}</div>
            <div className="pr-2 pb-4 ml-5">
                <Zoom>
                    <img
                        alt="screenshot"
                        src={convertFileSrc(content)}
                        height="500"
                        width="500"
                        />
                </Zoom>
            </div>
        </div>
    )
}

export { Screenshot }