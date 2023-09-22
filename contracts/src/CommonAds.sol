// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ERC721} from "solady/tokens/ERC721.sol";
import {FixedPointMathLib as Math} from "solady/utils/FixedPointMathLib.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";

contract CommonAds is ERC721 {
    using Math for uint256;
    using SafeTransferLib for address;

    struct Metadata {
        string name;
        string desc;
        string link;
        string img;
    }

    struct Spot {
        uint256 setPrice;
        uint256 lastUpdatedAt;
        bytes32 metaId;
        bool inAuction;
    }

    struct SpotDetails {
        Metadata metadata;
        uint256 price;
        bool inAuction;
    }

    struct Space {
        address owner;
        uint256 totalSpots;
        bytes32 metaId;
        mapping(uint256 => Spot) spots;
    }

    uint256 public nextSpaceId;
    int256 internal immutable AUCTION_DECAY;
    mapping(bytes32 metaId => Metadata meta) public metadata;
    mapping(uint256 spaceId => Space) public spaces;
    mapping(address user => uint256) public balances;

    error NotSpotOwner();
    error PaymentBelowPrice();

    constructor() {
        AUCTION_DECAY = Math.lnWad(0.1e18) / int256(1 days);
    }

    function setMetadata(uint256 subId, Metadata calldata meta) external {
        bytes32 metaId = _getMetaId(msg.sender, subId);
        metadata[metaId] = meta;
    }

    function create(uint256 subId, uint256[] calldata prices) external {
        // TODO: Remove?
        uint256 totalPrices = prices.length;
        require(totalPrices == 3);
        uint256 spaceId;
        unchecked {
            spaceId = nextSpaceId++;
        }
        Space storage space = spaces[spaceId];
        space.metaId = _getMetaId(msg.sender, subId);
        space.owner = msg.sender;
        space.totalSpots = totalPrices;
        for (uint256 i = 0; i < totalPrices;) {
            _mint(msg.sender, _getSpotId(spaceId, i));
            space.spots[i] = Spot({
                lastUpdatedAt: block.timestamp,
                setPrice: prices[i],
                metaId: bytes32(0), // TODO: Make metadata getter return default for empty
                inAuction: true
            });
            // forgefmt: disable-next-item
            unchecked {
                ++i;
            }
        }
    }

    function setPrice(uint256 spotId, uint256 newPrice) external {
        if (!_authorized(msg.sender, spotId)) revert NotSpotOwner();
        _getSpot(spotId).setPrice = newPrice;
    }

    function buy(uint256 spotId, uint256 metaSubId, uint256 newPrice) external payable {
        uint256 price = getPrice(spotId);
        if (msg.value < price) revert PaymentBelowPrice();
        Spot storage spot = _getSpot(spotId);
        _transfer(ownerOf(spotId), msg.sender, spotId);
        spot.setPrice = newPrice;
        spot.lastUpdatedAt = block.timestamp;
        spot.metaId = _getMetaId(msg.sender, metaSubId);
        unchecked {
            uint256 refund = msg.value - price;
            if (refund > 0) msg.sender.safeTransferETH(refund);
        }
    }

    function getSpace(uint256 spaceId)
        external
        view
        returns (address owner, Metadata memory spaceMeta, SpotDetails[] memory spots)
    {
        Space storage space = spaces[spaceId];
        owner = space.owner;
        spaceMeta = metadata[space.metaId];
        uint256 totalSpots = space.totalSpots;
        spots = new SpotDetails[](totalSpots);
        for (uint256 i = 0; i < totalSpots;) {
            Spot storage spot = space.spots[i];
            spots[i].metadata = metadata[spot.metaId];
            spots[i].price = getPrice(_getSpotId(spaceId, i));
            spots[i].inAuction = spot.inAuction;
            // forgefmt: disable-next-item
            unchecked {
                ++i;
            }
        }
    }

    function getMetadata(address owner, uint256 subId) external view returns (Metadata memory) {
        return metadata[_getMetaId(owner, subId)];
    }

    function getPrice(uint256 spotId) public view returns (uint256) {
        Spot storage spot = _getSpot(spotId);
        return spot.setPrice;
    }

    function name() public pure override returns (string memory) {
        return "Common Ads";
    }

    function symbol() public pure override returns (string memory) {
        return "CAD";
    }

    function tokenURI(uint256) public pure override returns (string memory) {
        // TODO: Add URI
        return "MISSING";
    }

    function _getSpotId(uint256 spaceId, uint256 spotIndex) internal pure returns (uint256 spotId) {
        assert(spotIndex < 256);
        spotId = (spaceId << 8) | spotIndex;
    }

    function _getMetaId(address owner, uint256 subId) internal pure returns (bytes32 metaId) {
        assembly {
            mstore(0x00, subId)
            mstore(0x20, owner)
            metaId := keccak256(0x00, 0x40)
        }
    }

    function _getSpot(uint256 spotId) internal view returns (Spot storage spot) {
        uint256 spaceId = spotId >> 8;
        uint256 spotIndex = spotId & 0xff;
        return spaces[spaceId].spots[spotIndex];
    }

    function _authorized(address operator, uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) == operator;
    }
}
