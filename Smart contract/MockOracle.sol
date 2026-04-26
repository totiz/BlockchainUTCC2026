// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title MockOracle
 * @notice Implements a minimal Chainlink AggregatorV3Interface for local / Sepolia testing.
 *         Deploy two instances: one for ETH/USD and one for XAU/USD.
 *         Use setPrice() to simulate price changes and test liquidation scenarios.
 *
 * Chainlink Sepolia feeds (real, no mock needed):
 *   ETH/USD : 0x694AA1769357215DE4FAC081bf1f309aDC325306
 *   XAU/USD : 0x7b219F57a8e9C7303204Af681e9fA69d17ef626F
 */
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function getRoundData(uint80 _roundId)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

contract MockOracle is AggregatorV3Interface {
    address public owner;

    uint8  private _decimals;
    string private _description;
    int256 private _price;
    uint80 private _roundId;

    event PriceUpdated(int256 oldPrice, int256 newPrice);

    modifier onlyOwner() {
        require(msg.sender == owner, "MockOracle: not owner");
        _;
    }

    /**
     * @param initialPrice  Price with 8 decimals.
     *                      ETH/USD example: 200000000000 = $2000.00000000
     *                      XAU/USD example: 320000000000 = $3200.00000000
     * @param desc          Human-readable label, e.g. "ETH / USD"
     */
    constructor(int256 initialPrice, string memory desc) {
        require(initialPrice > 0, "MockOracle: price must be positive");
        owner       = msg.sender;
        _decimals   = 8;
        _description = desc;
        _price      = initialPrice;
        _roundId    = 1;
    }

    /// @notice Update mock price (owner only).
    function setPrice(int256 newPrice) external onlyOwner {
        require(newPrice > 0, "MockOracle: price must be positive");
        emit PriceUpdated(_price, newPrice);
        _price = newPrice;
        _roundId++;
    }

    // ─── AggregatorV3Interface ────────────────────────────────────────────────

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function description() external view override returns (string memory) {
        return _description;
    }

    function version() external pure override returns (uint256) {
        return 4;
    }

    function getRoundData(uint80 roundId_)
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        require(roundId_ <= _roundId, "MockOracle: round not found");
        return (roundId_, _price, block.timestamp, block.timestamp, roundId_);
    }

    function latestRoundData()
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (_roundId, _price, block.timestamp, block.timestamp, _roundId);
    }
}
