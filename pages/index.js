import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useContractRead, useContractWrite } from 'wagmi'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import CommonAds from 'src/common-ads'
import { parseEther } from "viem";

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

  const handleCreateSpace = async () => {
    console.log('create space button clicked')
    await writeMetadata();
    await createSpace();
  }

  {/* Functions for fetching a space */ }

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
    console.log('fetching space')
    if (spaceId && !isNaN(spaceId)) {  // Check if spaceId is defined and is a valid number
      setSpaceData(fetchSpace.data);
      console.log(fetchSpace.data)
      console.log('Space Data', spaceData)
      console.log('Space Owner', spaceData[0])
      console.log('Space Owner', spaceData[1].name)
    } else {
      console.error('Invalid spaceId:', spaceId);
    }
  };

  {/* Functions for buying a sponsor spot */ }
  const { write: buyNFT } = useContractWrite({
    ...CommonAds,
    functionName: 'buy',
    // args: [spotId, 0, newPrice],
    //spotId: getSpace, spotId = (spaceId << 8) | spotIndex
    //newPrice: 
    value: null //current price
  })

  const handleBuy = () => {
    console.log('buying nft')
    //set new price for spot
    //also need to get existing price from getting space
  }


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

      {spaceId && (
        <div>
          <h3>Owner: {spaceData[0]}</h3>
          <p>{spaceData[1].img}</p>
          <p>{spaceData[1].name}</p>
          <p>{spaceData[1].desc}</p>
          <p>{spaceData[1].link}</p>
          <button onClick={handleBuy}>Buy for ${prices[0]}</button>
          {/* Render the rest of the space data here */}
          {/* You can access spaceData.spaceMeta and spaceData.spots */}
        </div>
      )}
    </div>
  );
}