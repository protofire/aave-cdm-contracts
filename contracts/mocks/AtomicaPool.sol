// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/IAtomicaPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AtomicaPoolMock is ERC20, IAtomicaPool {
    address capitalToken;

    constructor(address _capitalToken) ERC20("ATOMICA_POOL", "POOL") {
        capitalToken = _capitalToken;
    }

    function deposit(uint256 capitalTokenAmount) external override {
        IERC20(capitalToken).transferFrom(
            msg.sender,
            address(this),
            capitalTokenAmount
        );
        _mint(msg.sender, capitalTokenAmount);
    }
}
