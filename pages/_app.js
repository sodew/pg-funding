import '@/styles/globals.css'
import { WagmiConfig, createConfig, mainnet } from 'wagmi'
import client from 'src/client'

const config = createConfig({
  autoConnect: true,
  publicClient: client,
})


export default function App({ Component, pageProps }) {
  return (
    <WagmiConfig config={config}>
      <Component {...pageProps} />
    </WagmiConfig>)
}
