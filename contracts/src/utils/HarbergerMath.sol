// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {FixedPointMathLib as Math} from "solady/utils/FixedPointMathLib.sol";

/// @author philogy <https://github.com/philogy>
library HarbergerMath {
    using Math for uint256;
    using Math for int256;

    function updateBalance(uint256 lastBalance, uint256 timeElapsed, uint256 payPerSecWad, uint256 decayPeriod)
        internal
        pure
        returns (bool preDecay, uint256 newBal)
    {
        if (timeElapsed == 0) return (true, lastBalance);
        uint256 fullBalDecrease = timeElapsed.mulWad(payPerSecWad);
        uint256 minimumNoDecayBal = decayPeriod.mulWad(payPerSecWad);

        // As long as sufficient balance to pay for tax, simply decrease.
        if (lastBalance >= fullBalDecrease + minimumNoDecayBal) {
            unchecked {
                return (true, lastBalance - fullBalDecrease);
            }
        }

        // Equivalent to: (last_bal / pay_per_sec - decay_period - time_elapsed) / decay_period
        int256 pastDecayWad =
            int256(lastBalance.divWad(fullBalDecrease)) - 1e18 - int256(timeElapsed.divWad(decayPeriod));

        return (false, minimumNoDecayBal.mulWad(uint256(Math.expWad(pastDecayWad))));
    }

    function getPayPerSecWad(uint256 price, uint256 yearlyTaxWad) internal pure returns (uint256 payPerSecWad) {
        return price * yearlyTaxWad / 365 days;
    }

    function updateAccount(
        uint256 lastBalance,
        uint256 timeElapsed,
        uint256 payPerSecWad,
        uint256 prevExpenseAcc,
        uint256 decayPeriod
    ) internal pure returns (bool preDecay, uint256 newBalance, uint256 newExpenseAcc) {
        (preDecay, newBalance) = updateBalance(lastBalance, timeElapsed, payPerSecWad, decayPeriod);
        uint256 newExpenditure = lastBalance - newBalance;
        newExpenseAcc = prevExpenseAcc;
        if (newExpenditure != 0 && payPerSecWad != 0) {
            newExpenseAcc += (newExpenditure * 1e18).divWad(payPerSecWad);
        }
    }

    function updateAccountWithPrice(
        uint256 setPrice,
        uint256 timeElapsed,
        uint256 ownerLastBalance,
        uint256 ownerPayPerSecWad,
        uint256 ownerExpenseAcc,
        uint256 decayPeriod,
        uint256 balToPriceCoefficient
    ) internal pure returns (uint256 currentPrice, uint256 newOwnerBalance, uint256 newOwnerExpenseAcc) {
        bool preDecay;
        (preDecay, newOwnerBalance, newOwnerExpenseAcc) =
            updateAccount(ownerLastBalance, timeElapsed, ownerPayPerSecWad, ownerExpenseAcc, decayPeriod);
        currentPrice = preDecay ? setPrice : newOwnerBalance.mulWad(balToPriceCoefficient);
    }

    function getTotalRewards(uint256 price, uint256 expenseAcc, uint256 yearlyTaxWad)
        internal
        pure
        returns (uint256 rewards)
    {
        return expenseAcc.mulWad(getPayPerSecWad(price, yearlyTaxWad));
    }

    function getNewRewards(uint256 price, uint256 lastRewardDebt, uint256 expenseAcc, uint256 yearlyTaxWad)
        internal
        pure
        returns (uint256 newRewardDebt, uint256 newRewards)
    {
        newRewardDebt = getTotalRewards(price, expenseAcc, yearlyTaxWad);
        newRewards = newRewardDebt - lastRewardDebt;
    }
}
