import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useContractRead, useContractWrite } from 'wagmi'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import CommonAds from 'src/common-ads'
import { parseEther } from "viem";

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#f7f7f7', // Matching the container background
    borderBottom: '1px solid #e1e1e1', // A subtle separator for the header
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333', // Darker color for the title text
  },
  container: {
    textAlign: 'center',
    padding: '40px',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    backgroundColor: '#f7f7f7', // A light gray background
    minHeight: '100vh', // Full viewport height
  },
  button: {
    backgroundColor: '#008CBA', // A more modern blue
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#007BAA', // A slightly darker blue on hover
    },
  },
  input: {
    padding: '12px 20px',
    margin: '8px 0',
    display: 'block',
    width: 'calc(100% - 24px)', // Account for padding
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    '&:focus': {
      borderColor: '#008CBA', // Highlight with the button color on focus
    },
  },
  inputContainer: {
    marginBottom: '40px',
  },
  connectedInfo: {
    backgroundColor: '#f2f2f2',
    borderRadius: '4px',
    padding: '10px',
    position: 'absolute',
    top: '20px',
    right: '20px',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gridGap: '20px',
  },
  unitCountBadge: {
    position: 'absolute', // Position relative to the card
    top: '10px',
    left: '10px',
    background: '#4CAF50', // Use a color that matches your button or theme
    color: 'white',
    padding: '5px 10px',
    borderRadius: '20px', // Circular or pill shape
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px'
    // boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // Optional: some shadow to make it "pop"
  },
  card: {
    // Add position: 'relative' to position the unitCountBadge absolutely relative to the card
    position: 'relative',
    boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)',
    transition: '0.3s',
    borderRadius: '5px',
    padding: '20px',
    margin: '16px',
    textAlign: 'center',
    background: 'white', // Ensure the background is not transparent
    // ... other card styles
  },
  lightboxModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // High z-index to ensure it's above other content
  },
  lightboxContent: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
    zIndex: 11,
  },
  closeButton: {
    cursor: 'pointer',
    backgroundColor: '#ffffff', // Or any color that fits your modal's design
    color: '#000000', // Typically, a close button is either black or red
    border: 'none',
    outline: 'none',
    fontSize: '24px', // Size of the close button
    position: 'absolute', // Position it absolutely within the lightboxContent
    top: '0.5rem', // Adjust as needed for your layout
    right: '0.5rem', // Adjust as needed for your layout
    padding: '0.5rem', // Padding around the button for a larger clickable area
    borderRadius: '50%', // Optional: if you want a circular button
    zIndex: 12, // Ensure it's above the modal content
  },
  slider: {
    width: '100%', // Full-width slider
    margin: '10px 0',
  },
  textInput: {
    width: '100%', // Full-width text inputs
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },

  // Add more styles as needed...
};


//checks for users wallet connection
function Profile() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  })
  const { disconnect } = useDisconnect()

  if (isConnected)
    return (
      <div style={styles.connectedInfo}>
        Connected to {address}
        <button style={styles.button} onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  return <button style={styles.button} onClick={() => connect()}>Connect Wallet</button>
}

function ClaimCard({ claim, index, onClaim }) {
  const [unitCount, setUnitCount] = useState(1);
  const [showModal, setShowModal] = useState(false); // State to manage modal visibility
  const [evalCount, setEvalCount] = useState(0)

  const [sliderValue, setSliderValue] = useState(0); // State for the slider
  const [textInputOne, setTextInputOne] = useState(''); // State for the first text input
  const [textInputTwo, setTextInputTwo] = useState(''); // State for the second text input

  // Function to toggle the modal visibility
  const toggleModal = () => {
    setShowModal(!showModal);
  };
  const { write: writeMetadata2 } = useContractWrite({
    ...CommonAds,
    functionName: 'setMetadata2',
    gasLimit: 300000,
    args: [0, metadata]
  });

  const handleCreateEval = async () => {
    console.log('create eval button clicked')
    await writeMetadata2();
    await createSpace();
    setMetadata2({ name: "", desc: "", link: "", img: "" });
  }

  return (
    <div style={styles.card}>
      <button style={styles.unitCountBadge} onClick={toggleModal}>
        {`${evalCount} evals`}
      </button>
      {showModal && (
        <div style={styles.lightboxModal}>
          <div style={styles.lightboxContent}>
            <button onClick={toggleModal} style={styles.closeButton}>&times;</button>
            <h2>Evaluate the claim</h2>



            {/* Text input one */}
            <input
              type="text"
              style={styles.textInput}
              value={textInputOne}
              onChange={(e) => setTextInputOne(e.target.value)}
              placeholder="Description"
            />

            {/* Text input two */}
            <input
              type="text"
              style={styles.textInput}
              value={textInputTwo}
              onChange={(e) => setTextInputTwo(e.target.value)}
              placeholder="Attachments (optional)"
            />

            {/* Slider */}
            <input
              type="range"
              style={styles.slider}
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => setSliderValue(e.target.value)}
            />
            {/* Number score for the slider */}
            <div style={{ ...styles.sliderValue, paddingBottom: 10 }}>
              Eval score: {sliderValue}
            </div>

            <button onClick={() => {
              toggleModal();
              setEvalCount(prevCount => prevCount + 1);
              handleCreateEval();
            }} style={styles.button}>Save</button>

            {/* Other modal content */}
          </div>
        </div>
      )}

      <h3>{claim.name}</h3>
      <p style={{fontSize: 12}}>{claim.link}</p>
      <p>{claim.desc}</p>
      
      <img src={claim.img} alt={claim.name} style={{ width: '100%', height: 'auto', borderRadius: styles.card.borderRadius }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
        <input
          type="number"
          style={styles.input}
          value={unitCount}
          onChange={(e) => setUnitCount(Number(e.target.value))}
          min="1"
        />
        <button
          style={{...styles.button, alignItems: 'center', justifyContent: 'center', padding: 8, fontSize: 12, paddingLeft: 30, paddingRight: 30}}
          onClick={() => onClaim(index, unitCount)}
        >
          Buy Units
        </button>
      </div>
      <div style={{ fontWeight: 500, paddingTop: 10 }}>{`${100 - claim.unitsClaimed || 100} units available`}</div>
      <button style={{border: 1, borderRadius: 2, padding: 10, marginTop: 5, backgroundColor: '#4CAF50', color: 'white' }}>See Evaluations</button>
    </div>
  );
}


export default function Home() {
  const [contract, setContract] = useState(null);

  const [metadata, setMetadata] = useState({ name: "", desc: "", link: "", img: "" });
  const [prices, setPrices] = useState([0, 0, 0]);

  const [spaceId, setSpaceId] = useState(0);
  const [spaceData, setSpaceData] = useState(null);

  const [claims, setClaims] = useState([]); // Added state to track claims
  const [filter, setFilter] = useState(''); // Holds the current filter

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setMetadata((prevState) => ({ ...prevState, [name]: value }));
  };

  // Define your options for the work scope dropdown
  const workScopeOptions = [
    "Research & Development",
    "Community Service",
    "Education",
    "Healthcare",
    "Technology",
    "Environment",
    "Longevity"
    // ... add other options as needed
  ];

  // Function to handle the filter change
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  // Filtered claims based on the selected work scope
  const filteredClaims = claims.filter(claim => {
    return filter === '' || claim.link === filter; // If filter is empty, return all claims, otherwise return claims that match the filter
  });

  const handleClaim = (claimIndex, unitCount) => {
    setClaims(currentClaims => {
      const newClaims = [...currentClaims];
      newClaims[claimIndex] = {
        ...newClaims[claimIndex],
        unitsClaimed: (newClaims[claimIndex].unitsClaimed || 0) + unitCount,
      };
      return newClaims;
    });
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

  

  const handleCreateCard = async () => {
    console.log('create space button clicked')
    // await writeMetadata();
    // await createSpace();
    setClaims(prevClaims => [...prevClaims, metadata]); // Add new claim to the list
    // Now call your blockchain functions to store the claim
    await writeMetadata();
    await createSpace();
    // Optionally reset metadata state here if you want the input fields to clear after submission
    setMetadata({ name: "", desc: "", link: "", img: "" });
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
    <div style={styles.container}>
      {/* Header section */}
      <div style={styles.header}>
        <h1 style={styles.title}>FundSci</h1>
        <div style={styles.profileContainer}>
          <Profile />
        </div>
      </div>
      <h2 style={{ paddingTop: 20 }}>Fund your Research</h2>
      <div style={styles.inputContainer}>
        <input style={styles.input} name="name" value={metadata.name} onChange={handleInputChange} placeholder="Name of Project" />
        <input style={styles.input} name="desc" value={metadata.desc} onChange={handleInputChange} placeholder="Description of action" />
        {/* <input style={styles.input} name="link" value={metadata.link} onChange={handleInputChange} placeholder="Work Scope" /> */}
        {/* Dropdown for Work Scope */}
        <select style={styles.input} name="link" value={metadata.link} onChange={handleInputChange}>
          <option value="">Select Work Scope</option>
          {workScopeOptions.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
        <input style={styles.input} name="img" value={metadata.img} onChange={handleInputChange} placeholder="Project Image" />
        <button style={styles.button} onClick={handleCreateCard}>Submit Claim</button>
      </div>

      {/* Dropdown for filtering cards based on work scope */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <label htmlFor="workScopeFilter">Filter by Work Scope:</label>
        <select
          id="workScopeFilter"
          style={styles.input}
          value={filter}
          onChange={handleFilterChange}
        >
          <option value="">All Work Scopes</option>
          {workScopeOptions.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Grid container for cards */}
      <div style={styles.gridContainer}>
        {claims.map((claim, index) => (
          <ClaimCard key={index} claim={claim} index={index} onClaim={handleClaim} />
        ))}
      </div>


    </div>
  );
}

