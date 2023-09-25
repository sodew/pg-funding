// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Test} from "forge-std/Test.sol";
import {CommonAds} from "src/CommonAds.sol";

/// @author philogy <https://github.com/philogy>
contract CommonAdsTest is Test {
    CommonAds ads;

    function setUp() public {
        ads = new CommonAds();
    }

    function testSimpleAuction() public {
        address project = makeAddr("project");
        uint256[] memory prices = new uint[](3);
        prices[0] = 10e18;

        vm.prank(project);
        ads.create(0, prices);

        for (uint256 i = 0; i < 10; i++) {
            skip(1 hours);
            emit log_named_decimal_uint("price", ads.getPrice(0), 18);
        }
    }
}
