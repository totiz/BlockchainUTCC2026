Here’s a **Product Requirements Document (PRD)** for your synthetic gold asset **TOTGLD**, designed in a Synthetix-style overcollateralized system using ETH and a gold oracle.

---

# 📄 Product Requirements Document (PRD)

## Product Name: **TOTGLD**

**Type:** Synthetic Asset (Crypto-backed)
**Blockchain:** Ethereum (EVM-compatible)
**Collateral:** ETH
**Reference Asset:** Gold (XAU/USD price)

---

# 1. 🎯 Objective

Create a decentralized synthetic asset **TOTGLD** that tracks the price of gold using an oracle, allowing users to:

* Mint TOTGLD by locking ETH as collateral
* Redeem TOTGLD back to ETH
* Trade TOTGLD as a gold exposure instrument without holding physical gold

---

# 2. 🧱 System Overview

### Core Components

1. **Collateral Vault (CDP-style)**

   * Users deposit ETH
   * Mint TOTGLD based on collateral ratio

2. **TOTGLD Token**

   * ERC-20 token
   * Represents synthetic gold exposure

3. **Price Oracle**

   * Provides XAU/USD price
   * Also requires ETH/USD price

4. **Liquidation Engine**

   * Ensures system solvency

5. **Mint / Burn Mechanism**

   * Mint: Lock ETH → Issue TOTGLD
   * Burn: Return TOTGLD → Unlock ETH

---

# 3. ⚙️ Key Parameters

| Parameter             | Description                     | Example |
| --------------------- | ------------------------------- | ------- |
| Collateral Ratio (CR) | Minimum required collateral     | 150%    |
| Liquidation Ratio     | Threshold for liquidation       | 120%    |
| Liquidation Penalty   | Penalty for unhealthy positions | 10%     |
| Mint Fee              | Fee when minting                | 0.3%    |
| Burn Fee              | Fee when redeeming              | 0.1%    |

---

# 4. 🔄 User Flows

## 4.1 Mint TOTGLD

1. User deposits ETH
2. System fetches:

   * ETH/USD price
   * XAU/USD price
3. Calculate max mintable TOTGLD:

[
\text{Max TOTGLD} = \frac{ETH_{value}}{CR \times GoldPrice}
]

4. Mint TOTGLD to user

---

## 4.2 Burn / Redeem TOTGLD

1. User submits TOTGLD
2. System burns tokens
3. Returns ETH based on current oracle price

---

## 4.3 Liquidation

Triggered when:

[
\text{Collateral Ratio} < \text{Liquidation Threshold}
]

* Liquidators repay debt
* Receive discounted ETH collateral

---

# 5. 🧮 Pricing Model

System depends on:

* **ETH/USD Oracle**
* **XAU/USD Oracle**

### Conversion Logic

[
TOTGLD_{value} = GoldPrice (USD)
]

[
ETH_{required} = \frac{GoldPrice}{ETHPrice}
]

---

# 6. 🏗️ Smart Contract Architecture

## 6.1 Contracts

### 1. `TOTGLDToken.sol`

* ERC-20
* Mint/Burn controlled by Vault

### 2. `Vault.sol`

* Handles:

  * Collateral deposits
  * Debt tracking
  * Mint/Burn logic

### 3. `Oracle.sol`

* Integrates with providers like:

  * Chainlink (preferred)
* Functions:

  * `getGoldPrice()`
  * `getETHPrice()`

### 4. `Liquidation.sol`

* Monitors unhealthy positions
* Executes liquidation

---

## 6.2 Data Structures

```solidity
struct Position {
    uint256 collateralETH;
    uint256 debtTOTGLD;
}
```

---

# 7. 🔐 Risk Management

## 7.1 Oracle Risk

* Use decentralized oracle (e.g., Chainlink)
* Add price sanity checks
* Implement TWAP fallback

## 7.2 Collateral Volatility

* ETH is volatile vs gold
* Require high CR (150–200%)

## 7.3 Liquidation Risk

* Fast liquidation mechanism required
* Incentivize liquidators properly

## 7.4 Peg Stability

* Arbitrage mechanism:

  * If TOTGLD > gold → mint & sell
  * If TOTGLD < gold → buy & burn

---

# 8. 📊 Economic Design

### Stability Mechanisms

* Overcollateralization
* Arbitrage incentives
* Fees tuning

### Revenue Streams

* Minting fees
* Redemption fees
* Liquidation penalties

---

# 9. 🧪 Edge Cases

| Scenario       | Handling                 |
| -------------- | ------------------------ |
| Oracle failure | Pause minting            |
| ETH crash      | Trigger mass liquidation |
| Gold spike     | Reduce mint capacity     |
| Low liquidity  | Incentivize LP           |

---

# 10. 🚀 MVP Scope

### Must Have

* Mint / Burn TOTGLD
* Oracle integration
* Frontend dashboard
* Combinded all function into single smart contract

<!-- ### Nice to Have
* Liquidation mechanism
* Multi-collateral support
* Stability pool -->

### Target Deployment
- Sepolia testnet
- Plain HTML frontend

---

# 11. 🔮 Future Extensions

* Multi-collateral (WBTC, stETH)
* Cross-chain deployment (L2s)
* Perpetual synthetic markets
* Integration with DeFi (AMMs, lending)

---

# 12. 🧠 Design Notes (Expert Insight)

* This is closer to **Synthetix v2 CDP model** than v3 pooled debt
* You may want to consider:

  * **Isolated vaults (Maker-style)** vs **global debt pool (SNX-style)**
* ETH vs Gold correlation is weak → expect frequent liquidation pressure
* Consider **delta-neutral hedging module** in future

---

# 13. ❓ Open Questions

1. Should TOTGLD be:

   * Fully redeemable? (recommended)
   * Or purely synthetic (no redemption)?

2. Oracle choice:

   * Chainlink XAU/USD?
   * Custom aggregator?

3. Liquidation design:

   * Dutch auction?
   * Fixed discount?

---

If you want, I can next:

* Design **Solidity contract skeleton (production-grade)**
* Or simulate **liquidation scenarios + stress test**
* Or design **tokenomics like SNX (staking + rewards)**
