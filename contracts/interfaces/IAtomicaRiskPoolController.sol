// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IAtomicaRiskPoolController {
    function deposit(
        address pool,
        uint256 assets,
        address receiver,
        uint256 minShares
    ) external returns (uint256 shares);
}
