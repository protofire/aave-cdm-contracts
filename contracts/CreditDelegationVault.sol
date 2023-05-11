// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./interfaces/AaveDebtToken.sol";
import "./interfaces/ICreditDelegationVault.sol";
import "./interfaces/IAavePool.sol";

contract CreditDelegationVault is ICreditDelegationVault, ReentrancyGuard {
    using SafeMath for uint;
    using SafeERC20 for IERC20;

    address public owner;
    address public manager;
    address factory;
    address public ATOMICA_POOL;
    address public DEBT_TOKEN;
    uint256 public loanAmount;

    constructor() {
        factory = address(0xdead);
    }

    function initialize(
        address _owner,
        address _manager,
        address _atomicaPool,
        address _debtToken
    ) external override {
        require(factory == address(0), "CDV001: Initialization Unauthorized");
        require(_owner != address(0), "CDV002: Owner is the zero address");
        require(_manager != address(0), "CDV003: Manager is the zero address");
        owner = _owner;
        manager = _manager;
        ATOMICA_POOL = _atomicaPool;
        DEBT_TOKEN = _debtToken;
    }

    event Borrow(address indexed vault, address indexed owner, uint256 amount);
    event ManagerChanged(
        address indexed vault,
        address indexed owner,
        address newManager
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "CDV004: Only owner");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == manager, "CDV005: Only manager");
        _;
    }

    function borrow(
        uint256 amount
    ) external nonReentrant onlyManager onlyOwner {
        address aavePool = _getAavePool();
        address asset = _getUnderlyingAsset();
        loanAmount += amount;
        IAavePool(aavePool).borrow(asset, amount, 2, 0, owner);
        IERC20(asset).safeTransfer(ATOMICA_POOL, amount);
        _transferPoolTokens();
        emit Borrow(address(this), owner, amount);
    }

    function borrowAllowance() external view returns (uint256) {
        return _borrowAllowance();
    }

    function changeManager(address _newManager) external onlyOwner {
        manager = _newManager;
        emit ManagerChanged(address(this), owner, manager);
    }

    function _borrowAllowance() internal view returns (uint256) {
        return AaveDebtToken(DEBT_TOKEN).borrowAllowance(owner, address(this));
    }

    function _transferPoolTokens() internal {
        uint256 balance = IERC20(ATOMICA_POOL).balanceOf(address(this));
        IERC20(ATOMICA_POOL).safeTransfer(owner, balance);
    }

    function _getAavePool() internal view returns (address) {
        return AaveDebtToken(DEBT_TOKEN).POOL();
    }

    function _getUnderlyingAsset() internal view returns (address) {
        return AaveDebtToken(DEBT_TOKEN).UNDERLYING_ASSET_ADDRESS();
    }
}
