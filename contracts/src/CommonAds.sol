// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ERC721} from "solady/tokens/ERC721.sol";
import {FixedPointMathLib as Math} from "solady/utils/FixedPointMathLib.sol";
import {HarbergerMath} from "./utils/HarbergerMath.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";
import {console2 as console} from "forge-std/console2.sol";

contract CommonAds is ERC721 {
    using Math for uint256;
    using Math for int256;
    using SafeTransferLib for address;

    struct Metadata {
        string name;
        string desc;
        string link;
        string img;
    }

    struct Account {
        uint256 lastBal;
        uint256 expenseAcc;
        uint256 lastUpdated;
        uint256 payPerSec;
    }

    struct Spot {
        uint256 rewardDebt;
        uint256 setPrice;
        uint256 auctionStartedAt;
        bytes32 metaId;
    }

    struct SpotDetails {
        Metadata metadata;
        uint256 price;
        uint256 auctionStartedAt;
    }

    struct Space {
        address owner;
        uint256 totalSpots;
        bytes32 metaId;
        mapping(uint256 => Spot) spots;
    }

    int256 internal immutable AUCTION_DECAY;
    uint256 internal constant TAX_RATE = 0.4e18;
    uint256 internal constant TAX_DECAY_PERIOD = 24 hours;

    uint256 public nextSpaceId;
    mapping(bytes32 metaId => Metadata meta) public metadata;
    mapping(uint256 spaceId => Space) public spaces;
    mapping(address owner => Account account) public accounts;

    error NotSpotOwner();
    error PaymentBelowPrice();

    constructor() {
        // Decay by 90% (1 - 0.9) every 24h
        AUCTION_DECAY = Math.lnWad(0.1e18) / int256(1 days);
    }

    modifier sync(address owner) {
        _sync(owner);
        _;
    }

    function setMetadata(uint256 subId, Metadata calldata meta) external {
        bytes32 metaId = _getMetaId(msg.sender, subId);
        metadata[metaId] = meta;
    }

    function deposit() external payable sync(msg.sender) {
        users[msg.sender].lastBal += msg.value;
    }

    function withdraw(uint256 amount) external payable sync(msg.sender) {
        users[msg.sender].lastBal -= amount;
        msg.sender.safeTransferETH(amount);
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
                rewardDebt: 0, // Rewards don't continuously accrue during auction
                auctionStartedAt: block.timestamp,
                setPrice: prices[i],
                metaId: bytes32(0) // TODO: Make metadata getter return default for empty
            });
            // forgefmt: disable-next-item
            unchecked { ++i; }
        }
    }

    function setPrice(uint256 spotId, uint256 newPrice) external {
        if (!_authorized(msg.sender, spotId)) revert NotSpotOwner();
        _getSpot(spotId).setPrice = newPrice;
    }

    function buy(uint256 spotId, uint256 metaSubId, uint256 newPrice) external payable sync(msg.sender) {
        uint256 price = getPrice(spotId);
        if (msg.value < price) revert PaymentBelowPrice();
        Spot storage spot = _getSpot(spotId);
        address spotOwner = ownerOf(spotId);
        _sync(spotOwner);
        users[spotOwner].lastBal += price;
        if (spot.auctionStartedAt != 0) {
            // TODO: Handle auction proceed
        } else {
            _sweepTaxes(spotId);
            users[spotOwner].payPerSec -= spot.setPrice * TAX_RATE / TAX_PERIOD;
        }
        _transfer(spotOwner, msg.sender, spotId);
        users[msg.sender].payPerSec += newPrice * TAX_RATE / TAX_PERIOD;
        spot.setPrice = newPrice;
        spot.auctionStartedAt = 0;
        spot.metaId = _getMetaId(msg.sender, metaSubId);
        spot.rewardDebt = newPrice * TAX_RATE * users[msg.sender].rewardsAcc / 1e36;
        unchecked {
            uint256 extra = msg.value - price;
            if (extra > 0) users[msg.sender].lastBal += extra;
        }
    }

    function sweep(uint256 spotId) external {
        _sweepTaxes(spotId);
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
            spots[i].price = spot.setPrice;
            spots[i].auctionStartedAt = spot.auctionStartedAt;
            // forgefmt: disable-next-item
            unchecked { ++i; }
        }
    }

    function getMetadata(address owner, uint256 subId) external view returns (Metadata memory) {
        return metadata[_getMetaId(owner, subId)];
    }

    function getPrice(uint256 spotId) public view returns (uint256) {
        Spot storage spot = _getSpot(spotId);
        uint256 price = spot.setPrice;
        uint256 auctionStartedAt = spot.auctionStartedAt;
        if (auctionStartedAt != 0) {
            uint256 delta = block.timestamp - auctionStartedAt;
            // C = ln(d) / T
            // p(dt) = p_0 * e^(dt * C)
            uint256 decay = uint256(Math.expWad(int256(delta) * AUCTION_DECAY));
            return price.mulWad(decay);
        }

        User memory user = users[ownerOf(spotId)];
        (bool preDecay, uint256 newBal) = _balanceOf(user);

        return preDecay ? price : newBal.mulWad(TAX_PERIOD).divWad(TAX_RATE).divWad(TAX_DECAY_PERIOD);
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

    function funds(address owner) public view returns (uint256) {
        (, uint256 bal) = _balanceOf(users[owner]);
        return bal;
    }

    function _sync(address owner) internal {
        User storage user = users[owner];
        (, user.lastBal, user.expenseAcc) = HarbergerMath.updateAccount(
            user.lastBal, block.timestamp - user.lastUpdated, user.payPerSec, user.expenseAcc, TAX_DECAY_PERIOD
        );
    }

    function _sweepTaxes(uint256 spotId) internal {
        Spot storage spot = _getSpot(spotId);
        // If auction skip sweep
        if (spot.auctionStartedAt != 0) return;
        address spotOwner = ownerOf(spotId);
        _sync(spotOwner);
        uint256 totalRewards = spot.setPrice * TAX_RATE * users[spotOwner].rewardsAcc / 1e36;
        uint256 newRewards = totalRewards - spot.rewardDebt;

        address spaceOwner = spaces[spotId >> 8].owner;
        _sync(spaceOwner);
        users[spaceOwner].lastBal += newRewards;

        spot.rewardDebt = totalRewards;
    }

    function _balanceOf(User memory user) internal view returns (bool, uint256) {
        return HarbergerMath.updateBalance(
            user.lastBal, block.timestamp - user.lastUpdated, user.payPerSec, TAX_DECAY_PERIOD
        );
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
