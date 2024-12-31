import { Header } from './components/Header'
import { RecoilRoot } from 'recoil'
import { Main } from './components/Main'
import { SideMenu } from './components/SideMenu'
import { ToastContainer } from 'react-toastify';
import 'react-medium-image-zoom/dist/styles.css'

function App() {

  return (
    <RecoilRoot>
      <Header />
      <div style={{ display: "flex" }}>
        <SideMenu />
        <Main />
        <ToastContainer/>
      </div>
    </RecoilRoot>
  )
}

export default App
