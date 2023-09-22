import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useContractRead, useContractWrite } from 'wagmi'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import CommonAds from 'src/common-ads'

//checks for users wallet connection
function Profile() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  })
  const { disconnect } = useDisconnect()

  // const metadata = useContractRead({
  //   ...CommonAds,
  //   functionName: 'getMetadata',
  //   args: [address, 0]
  // })
  // console.log('metadata:', metadata.data)

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
  const [contract, setContract] = useState(null);

  const [metadata, setMetadata] = useState({ name: "", desc: "", link: "", img: "" });
  const [prices, setPrices] = useState([0, 0, 0]);

  const { writeMetadata } = useContractWrite({
    ...CommonAds,
    functionName: 'setMetadata',
    gasLimit: 300000,
    args: [0, metadata]
  });

  const { createProject } = useContractWrite({
    ...CommonAds,
    functionName: 'create',
    gasLimit: 300000,
    args: [0, prices]
  })

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setMetadata((prevState) => ({ ...prevState, [name]: value }));
  };

  return (
    <div style={{ textAlign: "center" }}>


      <h1>Open Source Project Auction</h1>

      <Profile />

      <h2>Create a New Project</h2>

      <div>
        <input name="name" value={metadata.name} onChange={handleInputChange} placeholder="Name" />
        <input name="desc" value={metadata.desc} onChange={handleInputChange} placeholder="Description" />
        <input name="link" value={metadata.link} onChange={handleInputChange} placeholder="Link" />
        <input name="img" value={metadata.img} onChange={handleInputChange} placeholder="Image URL" />
        <button onClick={(() => writeMetadata(), () => createProject())}>Submit Metadata</button>
      </div>

      <button onClick={(() => handleSubmitMetadata())}>See Metadata</button>

      <h2>Fetch Project</h2>

      <input
        placeholder="Project ID"
        onChange={(e) => setProjectId(e.target.value)}
      />
      <button onClick={() => fetchProject(projectId)}>Fetch Project</button>

      {/* {projectName && (
        <div>
          <h3>Project: {projectName}</h3>
          <p>Balance: {projectBalance}</p>
          <ul>
            {nfts.map((nft, index) => (
              <li key={index}>
                <p>NFT!</p>
              </li>
            ))}
          </ul>
        </div>
      )} */}
    </div>
  );
}