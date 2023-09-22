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

  const [spaceId, setSpaceId] = useState(0);
  const [spaceData, setSpaceData] = useState(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setMetadata((prevState) => ({ ...prevState, [name]: value }));
  };

  {/* Functions for creating a space */ }

  const { write: writeMetadata } = useContractWrite({
    ...CommonAds,
    functionName: 'setMetadata',
    gasLimit: 300000,
    args: [0, metadata]
  });

  const { write: createSpace } = useContractWrite({
    ...CommonAds,
    functionName: 'create',
    gasLimit: 300000,
    args: [0, prices]
  })

  const handleCreateSpace = async() => {
    console.log('create space button clicked')
    await writeMetadata();
    await createSpace();
  }

  // Configure the useContractRead hook
  const fetchSpace = useContractRead({
    ...CommonAds,
    functionName: 'getSpace',
    args: [spaceId],
    onSuccess: (data) => {
      console.log('Success:', data);
      setSpaceData(data);  // Update state with fetched data
    },
    onError: (error) => {
      console.error('Error fetching space:', error);
    },
  });

  const handleFetchSpace = () => {
    console.log('test')
    if (spaceId && !isNaN(spaceId)) {  // Check if spaceId is defined and is a valid number
      fetchSpace();
    } else {
      console.error('Invalid spaceId:', spaceId);
    }
  };


  return (
    <div style={{ textAlign: "center" }}>

      <h1>Open Source Project Auction</h1>

      <Profile />

      <h2>Create a New Space</h2>

      <div>
        <input name="name" value={metadata.name} onChange={handleInputChange} placeholder="Name" />
        <input name="desc" value={metadata.desc} onChange={handleInputChange} placeholder="Description" />
        <input name="link" value={metadata.link} onChange={handleInputChange} placeholder="Link" />
        <input name="img" value={metadata.img} onChange={handleInputChange} placeholder="Image URL" />
        <button onClick={handleCreateSpace}>Submit Metadata</button>
      </div>

      <h2>Fetch Space</h2>

      <input
        placeholder="Space ID"
        onChange={(e) => setSpaceId(e.target.value)}
      />
      <button onClick={handleFetchSpace}>Fetch Space</button>

      {spaceData && (
        <div>
          <h3>Owner: {spaceData.owner}</h3>
          {/* Render the rest of the space data here */}
          {/* You can access spaceData.spaceMeta and spaceData.spots */}
        </div>
      )}
    </div>
  );
}