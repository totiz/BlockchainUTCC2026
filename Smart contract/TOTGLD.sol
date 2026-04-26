// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.6.0
pragma solidity ^0.8.27;

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                         TOTGLD — Synthetic Gold                         ║
 * ║                                                                          ║
 * ║  MVP single-contract implementation (PRD §10).                           ║
 * ║                                                                          ║
 * ║  Architecture                                                            ║
 * ║  ─────────────────────────────────────────────────────────────────────  ║
 * ║  • ERC-20 token  (OZ ERC20 + ERC20Burnable)                             ║
 * ║  • CDP Vault     — per-user collateral/debt positions                    ║
 * ║  • Oracle        — Chainlink AggregatorV3Interface (ETH/USD & XAU/USD)  ║
 * ║  • Access/Safety — Ownable + ReentrancyGuard + Pausable                 ║
 * ║                                                                          ║
 * ║  Chainlink Sepolia feeds                                                 ║
 * ║    ETH/USD : 0x694AA1769357215DE4FAC081bf1f309aDC325306                 ║
 * ║    XAU/USD : 0x7b219F57a8e9C7303204Af681e9fA69d17ef626F                 ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import {ERC20}         from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable}       from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable}      from "@openzeppelin/contracts/utils/Pausable.sol";

// Minimal Chainlink interface — no external package needed
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
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

contract TOTGLD is ERC20, ERC20Burnable, Ownable, ReentrancyGuard, Pausable {

    // ─── Structs ──────────────────────────────────────────────────────────────

    /// @notice Per-user collateral debt position (CDP)
    struct Position {
        uint256 collateralETH; // wei locked by this user
        uint256 debtTOTGLD;    // TOTGLD (18 dec) owed by this user
    }

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @dev Minimum collateral ratio in percent (150 = 150%)
    uint256 public constant MIN_CR = 150;

    /// @dev Mint fee in basis points (30 = 0.30%)
    uint256 public constant MINT_FEE_BPS = 30;

    /// @dev Burn fee in basis points (10 = 0.10%)
    uint256 public constant BURN_FEE_BPS = 10;

    /// @dev Chainlink oracle staleness threshold (1 hour)
    uint256 public constant MAX_ORACLE_STALENESS = 1 hours;

    /// @dev Precision scale for Chainlink 8-decimal prices
    uint256 private constant PRICE_PRECISION = 1e8;

    // ─── State ────────────────────────────────────────────────────────────────

    AggregatorV3Interface public ethUsdFeed;
    AggregatorV3Interface public xauUsdFeed;

    mapping(address => Position) public positions;

    /// @notice Accumulated protocol fees (ETH, in wei)
    uint256 public totalProtocolFees;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Minted(
        address indexed user,
        uint256 ethDeposited,   // wei actually locked (after refund)
        uint256 totgldMinted,   // tokens received by user (after fee)
        uint256 feeTOTGLD       // tokens retained as protocol fee
    );

    event Burned(
        address indexed user,
        uint256 totgldBurned,   // tokens destroyed
        uint256 ethReturned,    // wei returned to user (after fee)
        uint256 feeETH          // wei retained as protocol fee
    );

    event PositionUpdated(
        address indexed user,
        uint256 collateralETH,
        uint256 debtTOTGLD
    );

    event OraclesUpdated(address ethFeed, address xauFeed);
    event FeesWithdrawn(address indexed to, uint256 amount);

    // ─── Custom errors ────────────────────────────────────────────────────────

    error ZeroAmount();
    error InsufficientETH();
    error BurnExceedsDebt();
    error OracleStalePriceFeed(address feed);
    error OracleInvalidPrice(address feed);
    error InsufficientCollateralForMint(uint256 maxMintable, uint256 requested);
    error NoFeesToWithdraw();
    error ETHTransferFailed();
    error ZeroAddress();

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param initialOwner  Address that will own the contract (receives admin rights).
     * @param _ethUsdFeed   Chainlink ETH/USD AggregatorV3 address.
     * @param _xauUsdFeed   Chainlink XAU/USD AggregatorV3 address.
     *
     * Sepolia:
     *   ethUsdFeed = 0x694AA1769357215DE4FAC081bf1f309aDC325306
     *   xauUsdFeed = 0x7b219F57a8e9C7303204Af681e9fA69d17ef626F
     */
    constructor(
        address initialOwner,
        address _ethUsdFeed,
        address _xauUsdFeed
    )
        ERC20("TOT Synthetic Gold", "TOTGLD")
        Ownable(initialOwner)
    {
        if (_ethUsdFeed == address(0) || _xauUsdFeed == address(0)) revert ZeroAddress();
        ethUsdFeed = AggregatorV3Interface(_ethUsdFeed);
        xauUsdFeed = AggregatorV3Interface(_xauUsdFeed);
    }

    // ─── Core: Mint ───────────────────────────────────────────────────────────

    /**
     * @notice Mint TOTGLD by sending ETH as collateral.
     *
     * The contract locks only the ETH needed to back `totgldAmount` at MIN_CR.
     * Any surplus ETH sent is refunded immediately.
     *
     * Fee: MINT_FEE_BPS of the minted tokens is retained in the contract;
     *      the remainder goes to the caller.
     *
     * @param totgldAmount Desired TOTGLD to receive (18-decimal units, after fee).
     *
     * Example (ETH=$2000, Gold=$2000, CR=150%):
     *   To mint 1 TOTGLD the system needs $3000 of ETH = 1.5 ETH.
     *   Send at least 1.5 ETH; contract refunds any excess.
     *   User receives 1 TOTGLD minus 0.3% fee = 0.997 TOTGLD.
     */
    function mintTOTGLD(uint256 totgldAmount)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        if (msg.value == 0)     revert InsufficientETH();
        if (totgldAmount == 0)  revert ZeroAmount();

        (uint256 ethPrice, uint256 goldPrice) = _fetchPrices();

        // ETH required to back `totgldAmount` at MIN_CR:
        //   requiredETH (wei) = totgldAmount * goldPrice * MIN_CR
        //                       / (ethPrice * 100)
        // Both goldPrice and ethPrice have PRICE_PRECISION (1e8) decimals,
        // they cancel out, leaving the result in 18-decimal wei.
        uint256 requiredETH = (totgldAmount * goldPrice * MIN_CR) / (ethPrice * 100);

        if (msg.value < requiredETH) {
            revert InsufficientCollateralForMint(
                _maxMintableInternal(msg.value, ethPrice, goldPrice),
                totgldAmount
            );
        }

        // Refund excess ETH (gas-limit: 2300 is intentionally avoided — use call)
        uint256 excessETH = msg.value - requiredETH;
        if (excessETH > 0) {
            (bool ok, ) = msg.sender.call{value: excessETH}("");
            if (!ok) revert ETHTransferFailed();
        }

        // Compute fee — retained in contract as TOTGLD
        // Gross minted = totgldAmount + fee  (so net after fee = totgldAmount)
        uint256 grossMint = (totgldAmount * 10000) / (10000 - MINT_FEE_BPS);
        uint256 feeTOTGLD = grossMint - totgldAmount;

        // Update position (user's debt = gross amount including fee,
        // but fee tokens belong to protocol; user only receives net)
        // We track total debt as gross so collateral math stays consistent.
        Position storage pos = positions[msg.sender];
        pos.collateralETH += requiredETH;
        pos.debtTOTGLD    += grossMint;

        // Mint to user (net) + mint fee to contract (held for owner withdrawal)
        _mint(msg.sender,  totgldAmount);
        _mint(address(this), feeTOTGLD);

        emit Minted(msg.sender, requiredETH, totgldAmount, feeTOTGLD);
        emit PositionUpdated(msg.sender, pos.collateralETH, pos.debtTOTGLD);
    }

    // ─── Core: Burn ───────────────────────────────────────────────────────────

    /**
     * @notice Burn TOTGLD to reclaim ETH collateral at current oracle price.
     *
     * ETH returned = (totgldAmount * goldPrice / ethPrice) * (1 - BURN_FEE_BPS/10000)
     *
     * Burn fee (ETH) is added to totalProtocolFees and redeemable by owner.
     *
     * @param totgldAmount TOTGLD (18-decimal) to burn. Must be <= position debt.
     */
    function burnTOTGLD(uint256 totgldAmount)
        external
        nonReentrant
        whenNotPaused
    {
        if (totgldAmount == 0) revert ZeroAmount();

        Position storage pos = positions[msg.sender];
        if (totgldAmount > pos.debtTOTGLD) revert BurnExceedsDebt();

        (uint256 ethPrice, uint256 goldPrice) = _fetchPrices();

        // ETH value of the redeemed TOTGLD at oracle price.
        // Cap at actual collateral to handle edge case where gold spiked since mint.
        uint256 grossETH = (totgldAmount * goldPrice) / ethPrice;
        if (grossETH > pos.collateralETH) {
            grossETH = pos.collateralETH;
        }

        // Apply burn fee
        uint256 feeETH    = (grossETH * BURN_FEE_BPS) / 10000;
        uint256 returnETH = grossETH - feeETH;

        // Update position — deduct exactly grossETH (= returnETH + feeETH)
        pos.debtTOTGLD    -= totgldAmount;
        pos.collateralETH -= grossETH;

        // On full close, sweep any residual collateral dust back to the user
        if (pos.debtTOTGLD == 0 && pos.collateralETH > 0) {
            uint256 residual  = pos.collateralETH;
            pos.collateralETH = 0;
            returnETH        += residual;
        }

        totalProtocolFees += feeETH;

        // Burn caller's tokens
        _burn(msg.sender, totgldAmount);

        // Return ETH to user
        if (returnETH > 0) {
            (bool ok, ) = msg.sender.call{value: returnETH}("");
            if (!ok) revert ETHTransferFailed();
        }

        emit Burned(msg.sender, totgldAmount, returnETH, feeETH);
        emit PositionUpdated(msg.sender, pos.collateralETH, pos.debtTOTGLD);
    }

    // ─── View: Position / Ratios ──────────────────────────────────────────────

    /**
     * @notice Current collateral ratio of a user's position, in percent.
     * @return cr  e.g. 150 means 150%.  Returns 0 if no debt.
     */
    function getCollateralRatio(address user) external view returns (uint256 cr) {
        Position memory pos = positions[user];
        if (pos.debtTOTGLD == 0) return 0;

        (uint256 ethPrice, uint256 goldPrice) = _fetchPricesView();

        // Collateral value in USD (18-dec):  collateralETH * ethPrice / PRICE_PRECISION
        // Debt value in USD (18-dec):        debtTOTGLD   * goldPrice / PRICE_PRECISION
        // CR = (collateralUSD / debtUSD) * 100
        uint256 collateralUSD = pos.collateralETH * ethPrice;
        uint256 debtUSD       = pos.debtTOTGLD    * goldPrice;

        cr = (collateralUSD * 100) / debtUSD;
    }

    /**
     * @notice Preview how much TOTGLD (after fee) you would receive for `ethWei`.
     */
    function getMaxMintable(uint256 ethWei) external view returns (uint256 netTOTGLD) {
        (uint256 ethPrice, uint256 goldPrice) = _fetchPricesView();
        uint256 gross = _maxMintableInternal(ethWei, ethPrice, goldPrice);
        // Deduct mint fee
        netTOTGLD = (gross * (10000 - MINT_FEE_BPS)) / 10000;
    }

    /**
     * @notice Preview how much ETH (after burn fee) you get for burning `totgldAmount`.
     */
    function getETHReturn(uint256 totgldAmount) external view returns (uint256 netETH) {
        (uint256 ethPrice, uint256 goldPrice) = _fetchPricesView();
        uint256 gross  = (totgldAmount * goldPrice) / ethPrice;
        uint256 feeETH = (gross * BURN_FEE_BPS) / 10000;
        netETH = gross - feeETH;
    }

    // ─── View: Prices ─────────────────────────────────────────────────────────

    /// @notice ETH/USD price with 8 decimal places (Chainlink native precision).
    function getETHPrice() external view returns (uint256) {
        (uint256 price, ) = _fetchPricesView();
        return price;
    }

    /// @notice XAU/USD price with 8 decimal places (Chainlink native precision).
    function getGoldPrice() external view returns (uint256) {
        (, uint256 price) = _fetchPricesView();
        return price;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Withdraw all accumulated protocol fees (ETH) to `to`.
    function withdrawFees(address payable to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();

        // Also sweep any TOTGLD fee tokens held by contract
        uint256 tokensHeld = balanceOf(address(this));
        if (tokensHeld > 0) {
            _transfer(address(this), to, tokensHeld);
        }

        uint256 ethFees = totalProtocolFees;
        if (ethFees == 0 && tokensHeld == 0) revert NoFeesToWithdraw();

        totalProtocolFees = 0;

        if (ethFees > 0) {
            (bool ok, ) = to.call{value: ethFees}("");
            if (!ok) revert ETHTransferFailed();
            emit FeesWithdrawn(to, ethFees);
        }
    }

    /// @notice Replace price feed addresses.
    function updateOracles(address _ethFeed, address _xauFeed) external onlyOwner {
        if (_ethFeed == address(0) || _xauFeed == address(0)) revert ZeroAddress();
        ethUsdFeed = AggregatorV3Interface(_ethFeed);
        xauUsdFeed = AggregatorV3Interface(_xauFeed);
        emit OraclesUpdated(_ethFeed, _xauFeed);
    }

    /// @notice Pause all mint/burn operations (oracle failure mitigation).
    function pause() external onlyOwner { _pause(); }

    /// @notice Resume operations.
    function unpause() external onlyOwner { _unpause(); }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    /**
     * @dev Fetch and validate both oracle prices. Reverts on stale or invalid data.
     *      Used in state-changing functions — performs external calls.
     */
    function _fetchPrices() internal view returns (uint256 ethPrice, uint256 goldPrice) {
        ethPrice  = _safePrice(ethUsdFeed);
        goldPrice = _safePrice(xauUsdFeed);
    }

    /**
     * @dev Same as _fetchPrices but for view functions (identical logic,
     *      separated to make intent explicit in call graph).
     */
    function _fetchPricesView() internal view returns (uint256 ethPrice, uint256 goldPrice) {
        ethPrice  = _safePrice(ethUsdFeed);
        goldPrice = _safePrice(xauUsdFeed);
    }

    /// @dev Fetch latest price from a Chainlink feed with staleness + sanity checks.
    function _safePrice(AggregatorV3Interface feed) internal view returns (uint256) {
        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,

        ) = feed.latestRoundData();

        if (answer <= 0) revert OracleInvalidPrice(address(feed));
        if (block.timestamp - updatedAt > MAX_ORACLE_STALENESS)
            revert OracleStalePriceFeed(address(feed));

        return uint256(answer);
    }

    /**
     * @dev Gross TOTGLD mintable from `ethWei` before fee deduction.
     *      gross = ethWei * ethPrice * 100 / (MIN_CR * goldPrice)
     *
     * Price precision (1e8) cancels between numerator and denominator,
     * leaving the result expressed in 18-decimal token units (matching ETH wei).
     */
    function _maxMintableInternal(
        uint256 ethWei,
        uint256 ethPrice,
        uint256 goldPrice
    ) internal pure returns (uint256) {
        return (ethWei * ethPrice * 100) / (MIN_CR * goldPrice);
    }

    // ─── Compiler overrides ───────────────────────────────────────────────────

    // ERC20Burnable and ERC20 both override _update — let Solidity resolve via super.
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20)
    {
        super._update(from, to, value);
    }

    // ─── Safety: reject plain ETH sends ──────────────────────────────────────

    receive() external payable {
        revert("TOTGLD: use mintTOTGLD()");
    }
}
