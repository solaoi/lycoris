import Player from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { MdiPlayCircle } from '../atoms/MdiPlayCircle';
import { MdiPauseCircle } from '../atoms/MdiPauseCircle';
import { MdiRewind } from '../atoms/MdiRewind';
import { MdiFastForward } from '../atoms/MdiFastForward';
import { MdiVolumeHigh } from '../atoms/MdiVolumeHigh';
import { MdiVolumeMute } from '../atoms/MdiVolumeMute';

type AudioPlayerProps = {
    filePath: string
    className: string
    style: React.CSSProperties
}

const AudioPlayer = (props: AudioPlayerProps): JSX.Element => {
    const { style, className, filePath } = props

    return (
        <div style={style} className={className} >
            <Player
                src={filePath}
                onPlay={() => { }}
                style={{ background: "rgba(255,255,255,0.9)", height: "100px" }}
                customAdditionalControls={[<></>]}
                // bundle for offline
                customIcons={{
                    play: MdiPlayCircle({}),
                    pause: MdiPauseCircle({}),
                    rewind: MdiRewind({}),
                    forward: MdiFastForward({}),
                    volume: MdiVolumeHigh({}),
                    volumeMute: MdiVolumeMute({}),
                }}
            // other props here
            />
        </div>
    )
}

export { AudioPlayer }