// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface AaveDebtToken {
    function borrowAllowance(
        address fromUser,
        address toUser
    ) external view returns (uint256);

    function balanceOf(address user) external view returns (uint256);

    function UNDERLYING_ASSET_ADDRESS() external view returns (address);

    function POOL() external view returns (address);
}
