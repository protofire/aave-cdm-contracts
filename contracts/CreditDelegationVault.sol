// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./interfaces/AaveDebtToken.sol";
import "./interfaces/ICreditDelegationVault.sol";
import "./interfaces/IAavePool.sol";
import "./interfaces/IAtomicaPool.sol";

contract CreditDelegationVault is ICreditDelegationVault, ReentrancyGuard {
    using SafeMath for uint;
    using ECDSA for bytes32;

    address factory;
    address public owner;
    address public manager;
    address public ATOMICA_POOL;
    address public DEBT_TOKEN;
    uint256 public loanAmount;
    uint256 public model;

    constructor() {
        factory = address(0xdead);
    }

    function initialize(
        address _owner,
        address _manager,
        address _atomicaPool,
        address _debtToken,
        uint256 _model,
        uint256 _value,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s,
        uint256 _percentage
    ) external override {
        require(factory == address(0), "CDV001: Initialization Unauthorized");
        require(_owner != address(0), "CDV002: Owner is the zero address");
        require(_manager != address(0), "CDV003: Manager is the zero address");
        owner = _owner;
        manager = _manager;
        ATOMICA_POOL = _atomicaPool;
        DEBT_TOKEN = _debtToken;
        factory = msg.sender;
        model = _model;
        _delegationWithSig(_value, _deadline, _v, _r, _s);
        if (_percentage > 0) {
            _initBorrow(_value, _percentage);
        }
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

    modifier onlyAuthorized() {
        require(
            msg.sender == owner ||
                msg.sender == manager ||
                msg.sender == factory,
            "CDV005: Only authorized"
        );
        _;
    }

    function borrow(uint256 amount) public nonReentrant onlyAuthorized {
        address aavePool = _getAavePool();
        address asset = getUnderlyingAsset();
        loanAmount += amount;
        IAavePool(aavePool).borrow(asset, amount, model, 0, owner);
        _depositToPool(asset, amount);
        _transferPoolTokens();
        emit Borrow(address(this), owner, amount);
    }

    function borrowAllowance() external view returns (uint256) {
        return _borrowAllowance();
    }

    function changeManager(address _newManager) external onlyOwner {
        require(
            _newManager != address(0),
            "CDV008: Manager is the zero address"
        );
        manager = _newManager;
        emit ManagerChanged(address(this), owner, manager);
    }

    function getUnderlyingAsset() public view returns (address) {
        return AaveDebtToken(DEBT_TOKEN).UNDERLYING_ASSET_ADDRESS();
    }

    function updateAllowance(
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyOwner {
        _delegationWithSig(value, deadline, v, r, s);
    }

    function setModel(uint256 _model) external onlyOwner {
        model = _model;
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

    function _delegationWithSig(
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        AaveDebtToken(DEBT_TOKEN).delegationWithSig(
            owner,
            address(this),
            value,
            deadline,
            v,
            r,
            s
        );
    }

    function _initBorrow(uint256 value, uint256 percentage) private {
        require(
            percentage <= 10_000,
            "CDV009: percentage must be less than or equal to 100%"
        );

        uint256 amount = calculatePercentage(value, percentage);
        borrow(amount);
    }

    function calculatePercentage(
        uint256 value,
        uint256 bps
    ) internal pure returns (uint256 amount) {
        amount = (value * bps) / 10_000;
    }
}
