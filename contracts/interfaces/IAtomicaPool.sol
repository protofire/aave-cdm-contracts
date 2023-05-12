// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAtomicaPool is IERC20 {
    function deposit(uint256 capitalTokenAmount) external;
}
