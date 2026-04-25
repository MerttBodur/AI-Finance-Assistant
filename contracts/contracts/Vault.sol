// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MockAave.sol";

contract Vault is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Policy {
        uint256 maxSingleInvestment;
        uint256 monthlyLimit;
        uint256 minReserve;
        bool autoInvestEnabled;
        uint8 riskLevel;
    }

    IERC20 public usdc;
    MockAave public aave;
    address public executor;

    mapping(address => uint256) public balances;
    mapping(address => Policy) public policies;
    mapping(address => uint256) public monthlyInvested;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event AutoInvested(address indexed user, uint256 amount, uint8 riskLevel);
    event PolicyUpdated(address indexed user);

    modifier onlyExecutor() {
        require(msg.sender == executor, "not executor");
        _;
    }

    constructor(address usdcAddress, address aaveAddress, address executorAddress)
        Ownable(msg.sender)
    {
        usdc = IERC20(usdcAddress);
        aave = MockAave(aaveAddress);
        executor = executorAddress;
    }

    function deposit(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "amount = 0");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external whenNotPaused nonReentrant {
        require(balances[msg.sender] >= amount, "insufficient balance");
        balances[msg.sender] -= amount;
        usdc.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function setPolicy(Policy calldata p) external whenNotPaused {
        policies[msg.sender] = p;
        emit PolicyUpdated(msg.sender);
    }

    function autoInvest(address user, uint256 amount)
        external
        onlyExecutor
        whenNotPaused
        nonReentrant
    {
        Policy storage p = policies[user];
        require(p.autoInvestEnabled, "auto-invest disabled");
        require(amount <= p.maxSingleInvestment, "exceeds maxSingle");
        require(monthlyInvested[user] + amount <= p.monthlyLimit, "exceeds monthly");
        require(balances[user] >= amount + p.minReserve, "below minReserve");

        balances[user] -= amount;
        monthlyInvested[user] += amount;

        usdc.forceApprove(address(aave), amount);
        aave.deposit(amount);

        emit AutoInvested(user, amount, p.riskLevel);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
