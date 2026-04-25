// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title  SimpleBank
 * @author Orbix Tech — Ethereum Workshop
 * @notice Custodial ETH bank with internal balance accounting, owner-controlled
 *         system liquidity, and batch dividend distribution.
 *
 * @dev    Solvency invariant maintained at all times:
 *
 *             totalLiabilities <= address(this).balance
 *
 *         where `totalLiabilities` is the sum of every user's internal balance.
 *         The owner may only withdraw the *surplus*
 *         (`address(this).balance - totalLiabilities`), guaranteeing that
 *         user funds can never be drained through admin actions.
 *
 *         Funds enter the contract through three paths:
 *           1. {deposit}          — credited to the caller's internal balance.
 *           2. {depositToSystem}  — added to the surplus pool, not credited.
 *           3. {payDividends}     — moves surplus into user balances
 *                                   (no new ETH enters the contract).
 *
 *         Funds leave the contract through two paths:
 *           1. {withdraw}            — debits the caller's internal balance.
 *           2. {withdrawFromSystem}  — debits the surplus pool only.
 */
contract SimpleBank is Ownable2Step, ReentrancyGuard {
    using Address for address payable;

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice Hard cap on `payDividends` batch size to bound gas.
    uint256 public constant MAX_DIVIDEND_BATCH = 256;

    // ─── Storage ──────────────────────────────────────────────────────────────

    /// @notice Internal ETH balance credited to each user.
    mapping(address account => uint256 balance) public balances;

    /// @notice Sum of all user balances. Equals the contract's liability to users.
    uint256 public totalLiabilities;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event DividendPaid(address indexed user, uint256 amount);
    event SystemDeposited(address indexed admin, uint256 amount);
    event SystemWithdrawn(address indexed admin, uint256 amount);

    // ─── Custom Errors ────────────────────────────────────────────────────────

    error ZeroAmount();
    error ZeroAddress();
    error InsufficientBalance(uint256 available, uint256 requested);
    error InsufficientSurplus(uint256 surplus, uint256 requested);
    error LengthMismatch(uint256 recipientsLen, uint256 amountsLen);
    error EmptyBatch();
    error BatchTooLarge(uint256 length, uint256 maxLength);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
    }

    // ─── User Functions ───────────────────────────────────────────────────────

    /// @notice Deposit ETH and credit it to the caller's internal balance.
    function deposit() external payable {
        if (msg.value == 0) revert ZeroAmount();
        balances[msg.sender] += msg.value;
        totalLiabilities += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw `amount` from the caller's internal balance to their wallet.
     * @dev    Follows checks-effects-interactions and is `nonReentrant` for
     *         defense-in-depth.
     */
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        uint256 userBalance = balances[msg.sender];
        if (userBalance < amount) revert InsufficientBalance(userBalance, amount);

        // Effects
        unchecked {
            balances[msg.sender] = userBalance - amount;
            totalLiabilities -= amount; // safe: bounded by sum of balances
        }

        // Interaction
        emit Withdrawn(msg.sender, amount);
        payable(msg.sender).sendValue(amount);
    }

    /// @notice Returns the internal balance of `user`.
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    /// @notice Returns the surplus liquidity not allocated to any user.
    function surplus() public view returns (uint256) {
        // address(this).balance is always >= totalLiabilities by construction.
        return address(this).balance - totalLiabilities;
    }

    // ─── Admin Functions ──────────────────────────────────────────────────────

    /// @notice Owner injects liquidity into the system pool. Not credited to any user.
    function depositToSystem() external payable onlyOwner {
        if (msg.value == 0) revert ZeroAmount();
        emit SystemDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Owner pulls surplus liquidity to the owner address.
     * @dev    Cannot drain user balances: capped at the current surplus.
     */
    function withdrawFromSystem(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();

        uint256 available = surplus();
        if (available < amount) revert InsufficientSurplus(available, amount);

        emit SystemWithdrawn(msg.sender, amount);
        payable(owner()).sendValue(amount);
    }

    /**
     * @notice Batch credit dividends to a list of recipients from system surplus.
     * @dev    Reverts unless the contract surplus covers the full batch — this
     *         preserves the solvency invariant. Bounded by {MAX_DIVIDEND_BATCH}.
     */
    function payDividends(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        uint256 len = recipients.length;
        if (len != amounts.length) revert LengthMismatch(len, amounts.length);
        if (len == 0) revert EmptyBatch();
        if (len > MAX_DIVIDEND_BATCH) revert BatchTooLarge(len, MAX_DIVIDEND_BATCH);

        // Sum the batch and validate recipients up front.
        uint256 totalDividends;
        for (uint256 i; i < len; ) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];
            if (recipient == address(0)) revert ZeroAddress();
            if (amount == 0) revert ZeroAmount();
            totalDividends += amount;
            unchecked { ++i; }
        }

        // Solvency check: dividends must come from surplus, never from user funds.
        uint256 available = surplus();
        if (available < totalDividends) {
            revert InsufficientSurplus(available, totalDividends);
        }

        // Credit balances and grow liabilities atomically.
        totalLiabilities += totalDividends;
        for (uint256 i; i < len; ) {
            balances[recipients[i]] += amounts[i];
            emit DividendPaid(recipients[i], amounts[i]);
            unchecked { ++i; }
        }
    }

    // ─── Fallback ─────────────────────────────────────────────────────────────

    /**
     * @dev Plain ETH transfers (no calldata) are treated as system deposits when
     *      sent by the owner, and rejected otherwise. Prevents accidental loss
     *      of user funds and ensures the solvency invariant cannot be violated
     *      by stray transfers (which would otherwise inflate `surplus`
     *      unaccounted-for, but harmlessly — this is a UX guard, not a safety
     *      one). Users must call {deposit} explicitly.
     *
     *      NOTE: This contract can still receive ETH via `selfdestruct` or as
     *      the recipient of a coinbase block reward. Any such ETH increases
     *      `surplus()` and is withdrawable by the owner via
     *      {withdrawFromSystem}; user balances remain untouched.
     */
    receive() external payable {
        if (msg.sender != owner()) revert ZeroAmount();
        emit SystemDeposited(msg.sender, msg.value);
    }
}
