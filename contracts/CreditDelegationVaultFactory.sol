// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/proxy/Clones.sol";

import "./interfaces/AaveDebtToken.sol";
import "./interfaces/ICreditDelegatinVault.sol";

contract CreditDelegationVaultFactory {
    address public AAVE_CDV_IMPLEMENTATION;

    constructor(address _impl) {
        AAVE_CDV_IMPLEMENTATION = _impl;
    }

    event VaultCreated(address indexed vault, address indexed owner);

    function deployVault(
        address _manager,
        address _atomicaPool,
        address _debtToken,
        uint256 _allowanceAmount
    ) external returns (address vault) {
        vault = Clones.clone(AAVE_CDV_IMPLEMENTATION);
        ICreditDelegatinVault(vault).initialize(
            msg.sender,
            _manager,
            _atomicaPool,
            _debtToken
        );
        AaveDebtToken(_debtToken).approveDelegation(vault, _allowanceAmount);
        emit VaultCreated(vault, msg.sender);
    }
}
