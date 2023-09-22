import { WagmiConfig, createConfig, mainnet, publicProviders } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { localhost } from 'viem/chains';

console.log(JSON.stringify(mainnet))

// const client = createPublicClient(
//     // chain: {
//     //     rpcUrls: {
//     //         default: { http: ['http://localhost:8545'] }
//     //     }
//     // },
//     [localhost],

//     // p[publicProviders()]
//     transport: http()
// )
const client = createPublicClient({ chain: {
    ...localhost,
    id: 31337
}, transport: http() })
export default client