import { WagmiConfig, createConfig, mainnet, localhost } from 'wagmi'
import { createPublicClient, http } from 'viem'

console.log(JSON.stringify(mainnet))

const client = createPublicClient({
    chain: {
        rpcUrls: {
            default: { http: ['http://localhost:8545'] }
        }
    },
    transport: http()
})

export default client