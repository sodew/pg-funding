// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Test} from "forge-std/Test.sol";
import {CommonAds} from "src/CommonAds.sol";
import {console2 as console} from "forge-std/console2.sol";

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

    function testSimpleStream() public {
        address project = makeAddr("project");
        uint256[] memory prices = new uint[](3);
        prices[0] = 10 ether;
        vm.prank(project);
        ads.create(0, prices);
        assertEq(ads.ownerOf(0), project);

        address sponsor = makeAddr("sponsor");
        hoax(sponsor);
        ads.buy{value: 11 ether}(0, 0, 5 ether);

        emit log_named_decimal_uint("ads.funds(sponsor)", ads.funds(sponsor), 18);

        skip(1 hours);

        emit log_named_decimal_uint("ads.funds(sponsor)", ads.funds(sponsor), 18);
        emit log_named_decimal_uint("ads.funds(project)", ads.funds(project), 18);
        emit log_named_decimal_uint("ads.getPrice(0)", ads.getPrice(0), 18);

        uint256 totalDays = uint256(365) / uint256(2) + 4;
        uint256 inc = 4 hours;
        for (uint256 i = 0; i < totalDays * 1 days / inc; i++) {
            skip(inc);
            (uint256 d, uint256 h) = dh(block.timestamp);
            console.log("\n  -----------------------------\n  %d (%dd %d:00):", i, d, h);
            emit log_named_decimal_uint("  bal A", ads.funds(sponsor), 18);
            uint256 sid = vm.snapshot();
            ads.sweep(0);
            emit log_named_decimal_uint("  bal B", ads.funds(project), 18);
            vm.revertTo(sid);
            emit log_named_decimal_uint("  price", ads.getPrice(0), 18);
        }
    }

    function dh(uint256 t) internal pure returns (uint256 d, uint256 h) {
        h = t / 1 hours;
        d = h / 24;
        h = h % 24;
    }
}
