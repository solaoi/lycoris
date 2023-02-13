import Player from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

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
                onPlay={e => console.log("onPlay")}
                style={{ background: "rgba(255,255,255,0.9)", height: "100px" }}
                customAdditionalControls={[<></>]}
                showSkipControls={true}
            // other props here
            />
        </div>
    )
}

export { AudioPlayer }