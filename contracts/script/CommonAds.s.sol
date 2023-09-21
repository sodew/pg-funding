// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Script} from "forge-std/Script.sol";
import {CommonAds} from "src/CommonAds.sol";

contract CommonAdsScript is Script {
    function run() public {
        vm.startBroadcast(vm.envUint("PRIV_KEY"));
        new CommonAds();
        vm.stopBroadcast();
    }
}
