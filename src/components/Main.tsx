import { useRecoilValue } from 'recoil'
import { featureState } from '../store/atoms/featureState'
import { NoteMain } from './organisms/NoteMain'
import { SettingsMain } from './organisms/SettingsMain'

const Main = (): JSX.Element => {
    const feature = useRecoilValue(featureState)

    return (
        <main style={{ minWidth: "450px", width: "100%", flex: 1 }}>
            {feature === "note" && <NoteMain />}
            {feature === "settings" && <SettingsMain />}
        </main>
    )
}

export { Main }