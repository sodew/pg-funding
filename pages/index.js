import { useEffect, useState } from "react";
// import { getContract } from "../ethereum";
// import Counter from "../contracts/out/Counter.sol/Counter.json";

import { useAccount, useConnect, useDisconnect, useContractRead } from 'wagmi'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import CommonAds from 'src/common-ads'

function Profile() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  })
  const { disconnect } = useDisconnect()
  console.log('CommonAds:', CommonAds)
  const metadata = useContractRead({
    ...CommonAds,
    functionName: 'getMetadata',
    args: [address, 0]
  })

  //test 
  console.log('metadata:', metadata.data)

  if (isConnected)
    return (
      <div>
        Connected to {address}
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  return <button onClick={() => connect()}>Connect Wallet</button>
}

export default function Home() {
  const [count, setCount] = useState(0);
  const [contract, setContract] = useState(null);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectBalance, setProjectBalance] = useState(0);
  const [nfts, setNfts] = useState([]);

  // useEffect(() => {
  //   async function initContract() {
  //     const contract = getContract(
  //       "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  //       Counter.abi,
  //       0 // Use the first account as the signer
  //     );
  //     setContract(contract);
  //   //   const initialCount = await contract.getCount();
  //   //   setCount(initialCount.toNumber());
  //   }
  //   initContract();
  // }, []);

  async function createProject(name) {
    if (!contract) return;
    // const tx = await contract.createProject(name);
    // await tx.wait();
    // Optionally, you can refresh the UI or navigate the user to the new project.

    const tx = await contract.increment();
    await tx.wait();
    const updatedCount = await contract.getCount();
    setCount(updatedCount.toNumber());
  }

  async function fetchProject(id) {
    // if (!contract) return;
    // const project = await contract.getProjectById(id);
    // setProjectName(project.name);
    // setProjectBalance(project.balance.toNumber());
    // setNfts(project.nfts); // Assuming NFTs are stored as an array.
    setProjectName(id);
  }

  async function increment() {
    if (!contract) return;
    const tx = await contract.increment();
    await tx.wait();
    const updatedCount = await contract.getCount();
    setCount(updatedCount.toNumber());
  }

  return (
    <div style={{ textAlign: "center" }}>
      <Profile />
      <h1>Open Source Project Auction</h1>

      <h2>Projects created so far: {count}</h2>

      <h2>Create a New Project</h2>
      <input
        placeholder="Project Name"
        onChange={(e) => setProjectName(e.target.value)}
      />
      <button onClick={() => createProject(projectName)}>Create Project</button>

      <h2>Fetch Project</h2>
      <input
        placeholder="Project ID"
        onChange={(e) => setProjectId(e.target.value)}
      />
      <button onClick={() => fetchProject(projectId)}>Fetch Project</button>

      {projectName && (
        <div>
          <h3>Project: {projectName}</h3>
          <p>Balance: {projectBalance}</p>
          <ul>
            {nfts.map((nft, index) => (
              <li key={index}>
                <p>NFT!</p>
                {/* Render NFT metadata here */}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  //   return (
  //     <div style={{ textAlign: 'center'}}>
  //       <h1>Counter: {count}</h1>
  //       <button onClick={increment}>Increment</button>
  //     </div>
  //   );
}