// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Simulated yield pool. Holds USDC; yield accounting stays off-chain for the MVP.
contract MockAave {
    IERC20 public usdc;
    mapping(address => uint256) private _deposits;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address usdcAddress) {
        usdc = IERC20(usdcAddress);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "amount = 0");
        usdc.transferFrom(msg.sender, address(this), amount);
        _deposits[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(_deposits[msg.sender] >= amount, "insufficient");
        _deposits[msg.sender] -= amount;
        usdc.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function balanceOf(address user) external view returns (uint256) {
        return _deposits[user];
    }
}
