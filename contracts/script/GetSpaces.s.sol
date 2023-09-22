// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Script} from "forge-std/Script.sol";
import {CommonAds} from "src/CommonAds.sol";
import {console2 as console} from "forge-std/console2.sol";

contract CommonAdsScript is Script {
    CommonAds internal constant ads = CommonAds(0x5FbDB2315678afecb367f032d93F642f64180aa3);

    function run() public {
        uint256 nextSpaceId = ads.nextSpaceId();

        for (uint256 i; i < nextSpaceId; i++) {
            (address owner, CommonAds.Metadata memory meta, CommonAds.SpotDetails[] memory spots) = ads.getSpace(i);
            console.log("Space %d", i);
            console.log("  owner: %s", owner);
            console.log("  name: %s", meta.name);
            console.log("  desc: %s", meta.desc);
            console.log("  link: %s", meta.link);
            console.log("  img: %s", meta.img);
            console.log("");
            for (uint256 j = 0; j < spots.length; j++) {
                console.log("- Spot %d", j);
                console.log("    owner: %s", ads.ownerOf((i << 8) | j));
                console.log("    name: %s", spots[j].metadata.name);
                console.log("    desc: %s", spots[j].metadata.desc);
                console.log("    link: %s", spots[j].metadata.link);
                console.log("    img: %s", spots[j].metadata.img);
                console.log("    price: %d", spots[j].price);
                console.log("    in auction: %s", spots[j].inAuction ? "true" : "false");
            }
        }
    }
}
