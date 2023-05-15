// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface ICreditDelegationVault {
    function initialize(
        address _owner,
        address _manager,
        address _atomicaPool,
        address _debtToken
    ) external;

    function borrow(uint256 amount) external;

    function borrowAllowance() external view returns (uint256);

    function changeManager(address _newManager) external;

    function getUnderlyingAsset() external view returns (address);
}
