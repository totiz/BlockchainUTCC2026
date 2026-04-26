// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title  BankWithUSDT
 * @author Orbix Tech — Ethereum Workshop
 * @notice Custodial USDT bank with internal balance accounting, owner-controlled
 *         system liquidity, and batch dividend distribution.
 *
 * @dev    Solvency invariant maintained at all times:
 *
 *             totalLiabilities <= USDT.balanceOf(address(this))
 *
 *         where `totalLiabilities` is the sum of every user's internal balance.
 *         The owner may only withdraw the *surplus* (token balance minus
 *         liabilities), guaranteeing that user funds can never be drained
 *         through admin actions.
 *
 *         SafeERC20 is used so that USDT-style tokens that do not return a
 *         boolean from `transfer` / `transferFrom` work transparently.
 */
contract BankWithUSDT is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice USDT token this bank operates on.
    IERC20 public constant USDT = IERC20(0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0);

    /// @notice Hard cap on `payDividends` batch size to bound gas.
    uint256 public constant MAX_DIVIDEND_BATCH = 256;

    // ─── Storage ──────────────────────────────────────────────────────────────

    /// @notice Internal USDT balance credited to each user.
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

    /**
     * @notice Deposit `amount` USDT and credit it to the caller's internal balance.
     * @dev    Caller must `approve` this contract for at least `amount` first.
     */
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        uint256 balanceBefore = USDT.balanceOf(address(this));
        USDT.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = USDT.balanceOf(address(this)) - balanceBefore;

        balances[msg.sender] += received;
        totalLiabilities += received;
        emit Deposited(msg.sender, received);
    }

    /**
     * @notice Withdraw `amount` USDT from the caller's internal balance to their wallet.
     * @dev    Follows checks-effects-interactions and is `nonReentrant` for
     *         defense-in-depth.
     */
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        uint256 userBalance = balances[msg.sender];
        if (userBalance < amount) revert InsufficientBalance(userBalance, amount);

        unchecked {
            balances[msg.sender] = userBalance - amount;
            totalLiabilities -= amount;
        }

        emit Withdrawn(msg.sender, amount);
        USDT.safeTransfer(msg.sender, amount);
    }

    /// @notice Returns the internal balance of `user`.
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    /// @notice Returns the surplus liquidity not allocated to any user.
    function surplus() public view returns (uint256) {
        return USDT.balanceOf(address(this)) - totalLiabilities;
    }

    /// @notice On-chain USDT balance held by this contract.
    function contractBalance() external view returns (uint256) {
        return USDT.balanceOf(address(this));
    }

    // ─── Admin Functions ──────────────────────────────────────────────────────

    /**
     * @notice Owner injects USDT liquidity into the system pool.
     * @dev    Owner must `approve` this contract for `amount` first.
     */
    function depositToSystem(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();

        uint256 balanceBefore = USDT.balanceOf(address(this));
        USDT.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = USDT.balanceOf(address(this)) - balanceBefore;

        emit SystemDeposited(msg.sender, received);
    }

    /**
     * @notice Owner pulls surplus USDT to the owner address.
     * @dev    Cannot drain user balances: capped at the current surplus.
     */
    function withdrawFromSystem(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();

        uint256 available = surplus();
        if (available < amount) revert InsufficientSurplus(available, amount);

        emit SystemWithdrawn(msg.sender, amount);
        USDT.safeTransfer(owner(), amount);
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

        uint256 totalDividends;
        for (uint256 i; i < len; ) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];
            if (recipient == address(0)) revert ZeroAddress();
            if (amount == 0) revert ZeroAmount();
            totalDividends += amount;
            unchecked { ++i; }
        }

        uint256 available = surplus();
        if (available < totalDividends) {
            revert InsufficientSurplus(available, totalDividends);
        }

        totalLiabilities += totalDividends;
        for (uint256 i; i < len; ) {
            balances[recipients[i]] += amounts[i];
            emit DividendPaid(recipients[i], amounts[i]);
            unchecked { ++i; }
        }
    }
}
