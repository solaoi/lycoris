import Player from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

type AudioPlayerProps = {
    filePath: string
}

const AudioPlayer = (props: AudioPlayerProps): JSX.Element => {
    const { filePath } = props

    return (
        <Player
            src={filePath}
            onPlay={e => console.log("onPlay")}
        // other props here
        />
    )
}

export { AudioPlayer }