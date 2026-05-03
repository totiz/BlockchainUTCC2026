# WorkshopSolver — Technical Specification

**File:** `Smart contract/WorkshopSolver.sol`
**Solidity:** `^0.8.27`
**Status:** Implemented
**Date:** 2026-05-03

## 1. Purpose

Verify that a student has correctly deployed a `Wakanda (WAKA)` ERC20 token meeting the workshop's requirements, and record their pass status on-chain. The solver is the source of truth for grading — a student passes iff `submit(theirToken)` succeeds.

## 2. Reference Contract

The token students are expected to deploy follows the shape of `ThaiBaht4.sol`:

```solidity
contract ThaiBaht4 is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit, ERC20Freezable
```

— i.e. an OpenZeppelin v5 ERC20 with `Mintable` (custom), `Pausable`, `Freezable`, and `Ownable` modifiers. Students rename name/symbol to `Wakanda` / `WAKA` and mint specific balances.

## 3. Functional Requirements

### 3.1 Expected token state

| # | Check                                                        | Threshold                                              |
| - | ------------------------------------------------------------ | ------------------------------------------------------ |
| 1 | `token.name()`                                               | `== "Wakanda"`                                         |
| 2 | `token.symbol()`                                             | `== "WAKA"`                                            |
| 3 | `balanceOf(token.owner())`                                   | `>= 1,000,000` (whole tokens)                          |
| 4 | `balanceOf(0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045)`      | `>= 10,000` (whole tokens)                             |
| 5 | `balanceOf(0x3327873dc0474C3b8b784FDf89719bdC6d39eaFa)`      | `>= 50,000 AND <= 100,000` (whole tokens)              |
| 6 | `mint(address,uint256)` selector exists and is access-guarded | onlyOwner                                              |
| 7 | `pause()` AND `unpause()` selectors exist and are access-guarded | onlyOwner                                              |
| 8 | `freeze(address,uint256)` selector exists and is access-guarded | onlyOwner                                              |

### 3.2 Token-amount semantics

All numeric thresholds are **whole tokens**, scaled at runtime by `10 ** token.decimals()`. If `decimals()` reverts, the solver assumes 18.

### 3.3 Public surface

- **`check(address token) view returns (string)`** — runs all 8 checks, returns a human-readable report. Never reverts.
- **`submit(address token)`** — runs all 8 checks; on full pass, records `passed[msg.sender] = true` and `submittedToken[msg.sender] = token`. Reverts if already passed or any check fails.
- **`resetStudent(address student)`** — `onlyOwner`. Clears a student's pass state.

## 4. Design Decisions

| Decision                | Choice                                                  | Rationale                                                                                          |
| ----------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Amount units            | Whole tokens, scaled by `decimals()`                    | Matches how students think about `_mint(addr, 1_000_000 * 10**18)`; tolerant of non-default decimals. |
| "Owner" definition      | `token.owner()` (Ownable)                               | Robust regardless of who calls `submit`. Submitter need not be the token owner.                    |
| Pass record key         | Both `msg.sender` (student) and `submittedToken[student]` | Lets graders audit which token each wallet submitted while keeping a simple bool gate.             |
| Feature verification    | Probe selectors via `staticcall`                        | No ERC165 dependency; cheap; matches `onlyOwner` pattern in `ThaiBaht4.sol`.                       |
| Resubmit policy         | Revert if `passed[msg.sender]`                          | Prevents accidental double-credit; admin can `resetStudent` if needed.                             |
| `check` return shape    | Single concatenated string                              | Easy to display in any UI (Etherscan, Remix, custom front-end) without a typed decoder.            |
| Admin                   | `Ownable` (deployer-set)                                | Allows reset without requiring full immutability.                                                  |
| Expected addresses/name | Hard-coded `constant`                                   | Workshop rules are fixed; making them mutable invites griefing.                                    |

## 5. Architecture

```
┌────────────────────┐         staticcall          ┌──────────────────────┐
│  WorkshopSolver    │ ─── name/symbol/decimals ─▶ │  Student's Wakanda   │
│                    │ ─── balanceOf / owner    ─▶ │  (ERC20 + features)  │
│  - check(token)    │ ─── mint/pause/freeze    ─▶ │                      │
│  - submit(token)   │     selector probes         └──────────────────────┘
│  - resetStudent()  │
│                    │
│  passed[student]   │
│  submittedToken[…] │
└────────────────────┘
        ▲
        │ submit(token)
   ┌────┴─────┐
   │ Student  │
   └──────────┘
```

### 5.1 Internal layout

```
WorkshopSolver
├─ constants (EXPECTED_NAME, EXPECTED_SYMBOL, thresholds, addresses)
├─ storage  (passed, submittedToken)
├─ external
│  ├─ check(token) view → string
│  ├─ submit(token)
│  └─ resetStudent(student) onlyOwner
└─ internal
   ├─ _runChecks(token) → (bool[8], string[8])
   ├─ _safeName / _safeSymbol / _safeDecimals / _safeOwner / _safeBalance   (try/catch wrappers)
   ├─ _hasFunction(token, selectorCalldata)                                  (staticcall probe)
   ├─ _strEq(a, b)
   └─ _formatTokens(amount, decimals)
```

`check` and `submit` share a single internal `_runChecks` that produces parallel `bool[8]` results and `string[8]` per-step messages, so the two entry points cannot disagree.

## 6. API Reference

### 6.1 `check`

```solidity
function check(address token) external view returns (string memory);
```

Runs all 8 checks against `token` and returns a multi-line report:

```
Step 1 (name = "Wakanda"): OK
Step 2 (symbol = "WAKA"): WRONG (got "USDT")
Step 3 (owner() balance >= 1,000,000): OK
Step 4 (0xd8dA...6045 >= 10,000): WRONG (got 0 tokens)
Step 5 (0x3327...eaFa in [50,000..100,000]): OK
Step 6 (mint(address,uint256) exists): OK
Step 7 (pause()/unpause() exist): OK
Step 8 (freeze(address,uint256) exists): OK
Result: 6/8 - NOT PASSED
```

Never reverts — every external read is wrapped in `try/catch`. Safe to call against any address (EOA, malformed contract, non-ERC20).

### 6.2 `submit`

```solidity
function submit(address token) external;
```

Behavior:
1. If `passed[msg.sender]` → revert `AlreadyPassed()`
2. Run all 8 checks
3. If any check fails → revert `VerificationFailed(string)` carrying that step's report line
4. Else: set `passed[msg.sender] = true`, `submittedToken[msg.sender] = token`, emit `WorkshopPassed(msg.sender, token)`

### 6.3 `resetStudent`

```solidity
function resetStudent(address student) external onlyOwner;
```

Clears `passed[student]` and `submittedToken[student]`. Emits `StudentReset(student)`. Used to undo erroneous credits or allow re-attempts during workshop sessions.

### 6.4 Public storage

| Variable                           | Type                       | Purpose                            |
| ---------------------------------- | -------------------------- | ---------------------------------- |
| `passed(address)`                  | `mapping(address=>bool)`   | Whether this student has passed    |
| `submittedToken(address)`          | `mapping(address=>address)`| Token the student submitted        |
| `EXPECTED_NAME`                    | `string constant`          | `"Wakanda"`                        |
| `EXPECTED_SYMBOL`                  | `string constant`          | `"WAKA"`                           |
| `OWNER_MIN`, `ADDR_A_MIN`, `ADDR_B_MIN`, `ADDR_B_MAX` | `uint256 constant` | Whole-token thresholds |
| `ADDR_A`, `ADDR_B`                 | `address constant`         | Reference addresses                |

### 6.5 Events

```solidity
event WorkshopPassed(address indexed student, address indexed token);
event StudentReset(address indexed student);
```

### 6.6 Errors

```solidity
error AlreadyPassed();
error VerificationFailed(string reason);
```

## 7. Feature Detection Mechanism

For Steps 6–8 the solver needs to confirm that the student's contract implements specific functions (`mint`, `pause`, `unpause`, `freeze`). It uses **selector probing via staticcall**:

```solidity
function _hasFunction(address token, bytes memory data) private view returns (bool) {
    if (token.code.length == 0) return false;
    (bool success, bytes memory ret) = token.staticcall(data);
    return !success && ret.length > 0;
}
```

### 7.1 Why this works for `onlyOwner` functions

When a function exists and is guarded by OpenZeppelin's `Ownable`, the very first thing the EVM does after dispatch is run the modifier — which calls `_checkOwner()` and reverts with the **custom error** `OwnableUnauthorizedAccount(address account)` (4-byte selector + 32-byte address = 36 bytes). The state-changing body never runs. So:

| Scenario                                  | `success` | `ret.length` | Verdict     |
| ----------------------------------------- | --------- | ------------ | ----------- |
| Function exists, `onlyOwner` rejects caller | `false`   | `36` (custom error) | **exists** |
| Function exists, no access control, would write state | `false` | `0` (revert on SSTORE in static) | reported missing |
| Selector doesn't exist, no fallback       | `false`   | `0`          | missing     |
| Selector doesn't exist, fallback returns empty | `true` | `0`          | missing     |

### 7.2 Implication

A student whose `pause()` lacks `onlyOwner` will fail Step 7 because the solver reports it as missing. This is **intentional** — an unguarded pause function does not satisfy a workshop "Pausable [for owner]" requirement.

### 7.3 Probed selectors

| Function                       | Selector    |
| ------------------------------ | ----------- |
| `mint(address,uint256)`        | `0x40c10f19`|
| `pause()`                      | `0x8456cb59`|
| `unpause()`                    | `0x3f4ba83a`|
| `freeze(address,uint256)`      | computed from interface (matches ThaiBaht4) |

Resolved at compile time via `IWorkshopFeatures.<fn>.selector`.

## 8. Edge Cases and Robustness

| Input                                | Handling                                                             |
| ------------------------------------ | -------------------------------------------------------------------- |
| EOA address passed as `token`        | `token.code.length == 0` → all selector probes return `false`; `name()/symbol()/...` revert → `try/catch` returns defaults. Steps fail cleanly. |
| Contract that's not ERC20            | Each `_safe*` helper returns `("", false)` / `0` / `address(0)`. Steps 1–5 fail with `<no name()>` etc.; 6–8 report missing. |
| Contract with reverting fallback     | Selector probes return `success=false, data=<fallback revert>` → may produce false positives on Steps 6–8. Acceptable for workshop scope; tokens deployed from OZ wizard do not have such fallbacks. |
| Token with `decimals() == 6` (USDT-style) | Thresholds scale by `10**6`. Still pass-able if minted accordingly. |
| Token with overridden `decimals()` reverting | `_safeDecimals` returns `18` default. Thresholds still meaningful. |
| Submitting same token twice (same student) | Second call reverts `AlreadyPassed`.                              |
| Two students submitting same token   | Both pass independently. The token contract's state is shared but each student's `submittedToken[…]` records it. |
| Reentrancy                           | `submit` makes only `staticcall`s and writes after all reads. No external `call` is made. Safe. |

## 9. Security Considerations

- **No funds held.** Solver does not custody tokens or ETH; griefing surface is limited to spamming `submit`.
- **Admin power is bounded** to `resetStudent`. Admin cannot grant a pass nor change thresholds — the rules are `constant`.
- **Read-only view safety.** `check` uses only `staticcall`; cannot mutate the student's token state.
- **No proxy support.** A proxy that delegates to a different implementation per-block could pass at `check` time and fail at `submit` time (or vice versa). Acceptable for workshop scope.

## 10. Deployment

```solidity
constructor(address initialOwner) Ownable(initialOwner) {}
```

Deploy on Sepolia with `initialOwner` = workshop instructor's address. Verify on Etherscan so students can read `check(...)` from the explorer UI.

## 11. Testing Plan (suggested)

1. **Happy path** — deploy a `Wakanda` token from a Hardhat/Foundry mock, mint owner = 1M, ADDR_A = 10k, ADDR_B = 75k. `check` returns `8/8 - PASSED`; `submit` succeeds; `passed[student]` flips to `true`.
2. **Wrong name** — same as #1 but name="Notwakanda". `check` shows Step 1 WRONG; `submit` reverts with `VerificationFailed("Step 1 (name = "Wakanda"): WRONG (got "Notwakanda")")`.
3. **ADDR_B over cap** — mint 150k to ADDR_B. Step 5 fails with `WRONG (got 150000 tokens)`.
4. **Missing freeze** — deploy without ERC20Freezable. Step 8 fails.
5. **Already passed** — call `submit` twice, second reverts `AlreadyPassed`.
6. **Reset & re-submit** — owner calls `resetStudent`, student re-submits successfully.
7. **EOA address** — `check(EOA)` returns a coherent report with all steps WRONG, no revert.
8. **Non-ERC20 contract** — `check(somePlainContract)` returns coherent report, no revert.
9. **Non-18 decimals** — deploy a 6-decimal Wakanda, mint scaled accordingly. Should still pass.

## 12. Out of Scope

- Verifying additional OZ extensions (`ERC20Burnable`, `ERC20Permit`) — workshop requirements list only Mintable/Pausable/Freezable.
- Support for upgradable proxies as student deployments.
- Front-end UI; the contract is consumable via Etherscan, Remix, or any wallet.
- Off-chain attestation / signed certificates.
