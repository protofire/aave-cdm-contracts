// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./interfaces/AaveDebtToken.sol";
import "./interfaces/ICreditDelegationVault.sol";
import "./interfaces/IAavePool.sol";
import "./interfaces/IAtomicaPool.sol";

contract CreditDelegationVault is ICreditDelegationVault, ReentrancyGuard {
    using SafeMath for uint;

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

    modifier onlyOwnerOrManager() {
        require(
            msg.sender == owner || msg.sender == manager,
            "CDV005: Only owner or manager"
        );
        _;
    }

    function borrow(uint256 amount) external nonReentrant onlyOwnerOrManager {
        address aavePool = _getAavePool();
        address asset = getUnderlyingAsset();
        loanAmount += amount;
        IAavePool(aavePool).borrow(asset, amount, 2, 0, owner);
        _depositToPool(asset, amount);
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

    function getUnderlyingAsset() public view returns (address) {
        return AaveDebtToken(DEBT_TOKEN).UNDERLYING_ASSET_ADDRESS();
    }

    function _borrowAllowance() internal view returns (uint256) {
        return AaveDebtToken(DEBT_TOKEN).borrowAllowance(owner, address(this));
    }

    function _transferPoolTokens() internal {
        uint256 balance = IAtomicaPool(ATOMICA_POOL).balanceOf(address(this));
        require(
            IAtomicaPool(ATOMICA_POOL).transfer(owner, balance),
            "CDV006: Failed at transfering pool tokens"
        );
    }

    function _depositToPool(address asset, uint256 amount) internal {
        require(
            IERC20(asset).approve(ATOMICA_POOL, amount),
            "CDV007: Failed to approve tokens to deposit on Atomica"
        );
        IAtomicaPool(ATOMICA_POOL).deposit(amount);
    }

    function _getAavePool() internal view returns (address) {
        return AaveDebtToken(DEBT_TOKEN).POOL();
    }
}
