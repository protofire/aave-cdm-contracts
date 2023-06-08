// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./interfaces/ICreditDelegationVault.sol";
import "./CreditDelegationVault.sol";
import "./interfaces/AaveDebtToken.sol";

contract CreditDelegationVaultFactory {
    using Counters for Counters.Counter;

    address public immutable CDV_IMPLEMENTATION;
    mapping(address => address[]) vaults;
    mapping(address => Counters.Counter) private _nonces;

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
        bytes32 s,
        uint256 percentage,
        uint256 model
    ) external returns (address vault) {
        bytes32 salt = _generateSalt();
        vault = Clones.cloneDeterministic(CDV_IMPLEMENTATION, salt);
        vaults[msg.sender].push(vault);
        ICreditDelegationVault(vault).initialize(
            msg.sender,
            manager,
            atomicaPool,
            debtToken,
            model,
            value,
            deadline,
            v,
            r,
            s,
            percentage
        );
        emit VaultCreated(vault, msg.sender);
    }

    function vaultsByOwner(
        address _owner
    ) external view returns (address[] memory) {
        return vaults[_owner];
    }

    function nonces(address owner) public view returns (uint256) {
        return _nonces[owner].current();
    }

    function predictVaultAddress(
        address owner
    ) external view returns (address predicted) {
        uint256 currentNonce = _nonces[owner].current();
        bytes32 salt = keccak256(abi.encodePacked(msg.sender, currentNonce));
        predicted = Clones.predictDeterministicAddress(
            CDV_IMPLEMENTATION,
            salt
        );
    }

    function _useNonce(address owner) internal returns (uint256 current) {
        Counters.Counter storage nonce = _nonces[owner];
        current = nonce.current();
        nonce.increment();
    }

    function _generateSalt() internal returns (bytes32 salt) {
        uint256 nonce = _useNonce(msg.sender);
        salt = keccak256(abi.encodePacked(msg.sender, nonce));
    }
}
