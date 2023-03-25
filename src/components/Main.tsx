import { useRecoilValue } from 'recoil'
import { featureState } from '../store/atoms/featureState'
import { selectedNoteState } from '../store/atoms/selectedNoteState'
import { LogoMain } from './organisms/LogoMain'
import { NoteMain } from './organisms/NoteMain'
import { SettingsMain } from './organisms/SettingsMain'

const Main = (): JSX.Element => {
    const selectedNote = useRecoilValue(selectedNoteState)
    const feature = useRecoilValue(featureState)

    return (
        <main style={{ minWidth: "450px", width: "100%", flex: 1 }}>
            {feature === "note" && (selectedNote === null ? <LogoMain /> : <NoteMain />)}
            {feature === "settings" && <SettingsMain />}
        </main>
    )
}

export { Main }