import { WagmiConfig, createConfig, mainnet } from 'wagmi'
import { createPublicClient, http } from 'viem'

const client = createPublicClient({
    chain: mainnet,
    transport: http()
})

export default client