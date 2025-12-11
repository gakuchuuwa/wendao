// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title WenDAOMarket
 * @dev Decentralized Prediction Market using Parimutuel Betting.
 */
contract WenDAOMarket is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Outcome { Pending, Yes, No }

    uint256 public constant FEE_BPS = 100; // 1% Service Fee
    uint256 public accumulatedFees;

    struct Market {
        uint256 id;
        string question;
        uint256 endTime;
        Outcome outcome;
        uint256 totalYes;
        uint256 totalNo;
        uint256 rewardPool; // Pool available for distribution after fees
        bool resolved;
    }

    IERC20 public immutable usdtToken;
    uint256 public nextMarketId;
    mapping(uint256 => Market) public markets;
    
    // marketId => user => direction (1=Yes, 2=No) => amount
    mapping(uint256 => mapping(address => mapping(uint8 => uint256))) public bets;
    // marketId => user => hasClaimed
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    event MarketCreated(uint256 indexed id, string question, uint256 endTime);
    event BetPlaced(uint256 indexed marketId, address indexed user, uint8 direction, uint256 amount);
    event MarketResolved(uint256 indexed marketId, Outcome outcome, uint256 rewardPool, uint256 fee);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    constructor(address _usdtToken) Ownable(msg.sender) {
        usdtToken = IERC20(_usdtToken);
    }

    /**
     * @dev Create a new prediction market.
     * @param _question The question string.
     * @param _duration Duration in seconds until the market closes for betting.
     */
    function createMarket(string memory _question, uint256 _duration) external onlyOwner {
        require(_duration > 0, "Duration must be > 0");
        
        uint256 marketId = nextMarketId++;
        markets[marketId] = Market({
            id: marketId,
            question: _question,
            endTime: block.timestamp + _duration,
            outcome: Outcome.Pending,
            totalYes: 0,
            totalNo: 0,
            rewardPool: 0,
            resolved: false
        });

        emit MarketCreated(marketId, _question, block.timestamp + _duration);
    }

    /**
     * @dev Place a bet on a market.
     * @param _marketId The ID of the market.
     * @param _direction 1 for Yes, 2 for No.
     * @param _amount Amount of USDT to bet.
     */
    function placeBet(uint256 _marketId, uint8 _direction, uint256 _amount) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.endTime > block.timestamp, "Betting period ended");
        require(!market.resolved, "Market already resolved");
        require(_direction == 1 || _direction == 2, "Invalid direction. 1=Yes, 2=No");
        require(_amount > 0, "Amount must be > 0");

        // Transfer USDT from user to contract
        usdtToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Record bet
        bets[_marketId][msg.sender][_direction] += _amount;

        if (_direction == 1) {
            market.totalYes += _amount;
        } else {
            market.totalNo += _amount;
        }

        emit BetPlaced(_marketId, msg.sender, _direction, _amount);
    }

    /**
     * @dev Resolve the market outcome.
     * @param _marketId The ID of the market.
     * @param _outcome 1 for Yes, 2 for No.
     */
    function resolveMarket(uint256 _marketId, uint8 _outcome) external onlyOwner {
        Market storage market = markets[_marketId];
        require(!market.resolved, "Market already resolved");
        require(block.timestamp >= market.endTime, "Market not yet ended");
        require(_outcome == 1 || _outcome == 2, "Invalid outcome. 1=Yes, 2=No");

        market.outcome = _outcome == 1 ? Outcome.Yes : Outcome.No;
        market.resolved = true;

        // Calculate Fee
        uint256 totalPool = market.totalYes + market.totalNo;
        uint256 fee = (totalPool * FEE_BPS) / 10000;
        accumulatedFees += fee;
        market.rewardPool = totalPool - fee;

        emit MarketResolved(_marketId, market.outcome, market.rewardPool, fee);
    }

    /**
     * @dev Claim winnings for a resolved market.
     * @param _marketId The ID of the market.
     */
    function claimWinnings(uint256 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved");
        require(!hasClaimed[_marketId][msg.sender], "Already claimed");

        uint8 winningDirection = market.outcome == Outcome.Yes ? 1 : 2;
        uint256 userShare = bets[_marketId][msg.sender][winningDirection];
        require(userShare > 0, "No winnings to claim");

        uint256 totalWinningShares = winningDirection == 1 ? market.totalYes : market.totalNo;

        // Calculate winnings: (User Share / Total Winning Shares) * Reward Pool
        uint256 winnings = (userShare * market.rewardPool) / totalWinningShares;

        hasClaimed[_marketId][msg.sender] = true;
        usdtToken.safeTransfer(msg.sender, winnings);

        emit WinningsClaimed(_marketId, msg.sender, winnings);
    }

    /**
     * @dev Withdraw accumulated fees (Admin only).
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");
        
        accumulatedFees = 0;
        usdtToken.safeTransfer(msg.sender, amount);
        
        emit FeesWithdrawn(msg.sender, amount);
    }

    // Helper to get bet info
    function getBet(uint256 _marketId, address _user) external view returns (uint256 yesAmount, uint256 noAmount) {
        yesAmount = bets[_marketId][_user][1];
        noAmount = bets[_marketId][_user][2];
    }
}
