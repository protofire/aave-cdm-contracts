// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/proxy/Clones.sol";

import "./interfaces/ICreditDelegationVault.sol";
import "./CreditDelegationVault.sol";
import "./interfaces/AaveDebtToken.sol";

contract CreditDelegationVaultFactory {
    address public immutable CDV_IMPLEMENTATION;
    mapping(address => address[]) vaults;

    constructor(address _impl) {
        require(
            _impl != address(0),
            "CDVF001: Implementation is the zero address"
        );
        CDV_IMPLEMENTATION = _impl;
    }

    event VaultCreated(address indexed vault, address indexed owner);

    function deployVault(
        address manager,
        address atomicaPool,
        address debtToken,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (address vault) {
        vault = Clones.clone(CDV_IMPLEMENTATION);
        ICreditDelegationVault(vault).initialize(
            msg.sender,
            manager,
            atomicaPool,
            debtToken
        );
        AaveDebtToken(debtToken).delegationWithSig(
            msg.sender,
            vault,
            value,
            deadline,
            v,
            r,
            s
        );
        vaults[msg.sender].push(vault);
        emit VaultCreated(vault, msg.sender);
    }

    function vaultsByOwner(
        address _owner
    ) external view returns (address[] memory) {
        return vaults[_owner];
    }
}
