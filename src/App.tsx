import { Header } from './components/organisms/Header'
import { RecoilRoot } from 'recoil'
import { Footer } from './components/organisms/Footer'
import { Main } from './components/organisms/Main'

function App() {

  return (
    <RecoilRoot>
      <Header />
      <Main />
      <Footer />
    </RecoilRoot>
  )
}

export default App
