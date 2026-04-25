// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    // Anyone can mint on testnet; this is intentional for MVP demo flows.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
