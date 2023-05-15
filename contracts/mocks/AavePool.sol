// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../interfaces/IAavePool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AavePoolMock is IAavePool {
    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 referralCode,
        address onBehalfOf
    ) external override {
        IERC20(asset).transfer(msg.sender, amount);
    }
}
