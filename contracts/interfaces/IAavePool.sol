// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IAavePool {
    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 referralCode,
        address onBehalfOf
    ) external;
}
