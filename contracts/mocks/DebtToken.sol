// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DebtTokenMock is ERC20 {
    address assetAddress;
    address poolAddress;

    constructor(address asset, address pool) ERC20("DebtToken", "debt") {
        assetAddress = asset;
        poolAddress = pool;
        _mint(msg.sender, 1000e18);
    }

    function approveDelegation(address delegatee, uint256 amount) external {
        approve(delegatee, amount);
    }

    function UNDERLYING_ASSET_ADDRESS() external view returns (address) {
        return assetAddress;
    }

    function POOL() external view returns (address) {
        return poolAddress;
    }

    function borrowAllowance(
        address fromUser,
        address toUser
    ) external view returns (uint256) {
        return allowance(fromUser, toUser);
    }
}
