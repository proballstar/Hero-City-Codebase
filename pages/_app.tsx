import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { MoralisProvider } from 'react-moralis'
import Navbar from '../src/components/navbar'
import MoralisConfig from '../moralis.server.json'

function MyApp({ Component, pageProps }: AppProps) {
  
  return (
    <MoralisProvider appId={MoralisConfig.APP_ID} serverUrl={MoralisConfig.SERVER_URL}>
      <div>
        <Component {...pageProps} />
      </div>
    </MoralisProvider>
  )
}

export default MyApp
