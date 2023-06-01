// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract DebtTokenMock is ERC20, ERC20Permit {
    address assetAddress;
    address poolAddress;

    constructor(
        address asset,
        address pool
    ) ERC20("DebtToken", "debt") ERC20Permit("DebtToken") {
        assetAddress = asset;
        poolAddress = pool;
        _mint(msg.sender, 1000e18);
    }

    function approveDelegation(address delegatee, uint256 amount) external {
        approve(delegatee, amount);
    }

    function delegationWithSig(
        address delegator,
        address delegatee,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        permit(delegator, delegatee, value, deadline, v, r, s);
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
