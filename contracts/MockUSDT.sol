// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @dev Simple ERC20 token for testing purposes with a faucet function.
 */
contract MockUSDT is ERC20, Ownable {
    constructor() ERC20("Mock USDT", "mUSDT") Ownable(msg.sender) {
        // Mint some initial supply to the deployer
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    /**
     * @dev Faucet function to get free tokens for testing.
     * @param to The address to receive the tokens.
     * @param amount The amount of tokens to mint.
     */
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
