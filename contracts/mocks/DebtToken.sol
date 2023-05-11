// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DebtTokenMock is ERC20 {
    address ASSET_ADDRESS;
    address POOL_ADDRESS;

    constructor(address asset, address pool) ERC20("DebtToken", "debt") {
        ASSET_ADDRESS = asset;
        POOL_ADDRESS = pool;
        _mint(msg.sender, 1000e18);
    }

    function approveDelegation(address delegatee, uint256 amount) external {
        approve(delegatee, amount);
    }

    function UNDERLYING_ASSET_ADDRESS() external view returns (address) {
        return ASSET_ADDRESS;
    }

    function POOL() external view returns (address) {
        return POOL_ADDRESS;
    }

    function borrowAllowance(
        address fromUser,
        address toUser
    ) external view returns (uint256) {
        return allowance(fromUser, toUser);
    }
}
