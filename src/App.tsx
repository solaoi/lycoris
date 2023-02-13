import { Header } from './components/Header'
import { RecoilRoot } from 'recoil'
import { Main } from './components/Main'
import { SideMenu } from './components/SideMenu'

function App() {

  return (
    <RecoilRoot>
      <Header />
      <div style={{display: "flex"}}>
        <SideMenu />
        <Main />
      </div>
    </RecoilRoot>
  )
}

export default App
