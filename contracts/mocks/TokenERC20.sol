// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenERC20Mock is ERC20 {
    constructor() ERC20("AssetToken", "asset") {
        _mint(msg.sender, 1000e18);
    }
}
