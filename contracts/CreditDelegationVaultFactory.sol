// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/proxy/Clones.sol";

import "./interfaces/ICreditDelegationVault.sol";

contract CreditDelegationVaultFactory {
    address public immutable CDV_IMPLEMENTATION;

    constructor(address _impl) {
        require(
            _impl != address(0),
            "CDVF001: Implementation is the zero address"
        );
        CDV_IMPLEMENTATION = _impl;
    }

    event VaultCreated(address indexed vault, address indexed owner);

    function deployVault(
        address _manager,
        address _atomicaPool,
        address _debtToken
    ) external returns (address vault) {
        vault = Clones.clone(CDV_IMPLEMENTATION);
        ICreditDelegationVault(vault).initialize(
            msg.sender,
            _manager,
            _atomicaPool,
            _debtToken
        );
        emit VaultCreated(vault, msg.sender);
    }
}
