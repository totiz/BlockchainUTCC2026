# TOTGLD System & Flow Diagrams

> Generated from `Smart contract/TOTGLD.sol` and `Smart contract/MockOracle.sol`

---

## 1. System Architecture (Class Diagram)

Shows contract inheritance, interfaces, and relationships.

```mermaid
classDiagram
    direction TB

    class AggregatorV3Interface {
        <<interface>>
        +decimals() uint8
        +description() string
        +version() uint256
        +getRoundData(roundId) tuple
        +latestRoundData() tuple
    }

    class MockOracle {
        +address owner
        -uint8 _decimals
        -string _description
        -int256 _price
        -uint80 _roundId
        +constructor(initialPrice, desc)
        +setPrice(newPrice) onlyOwner
        +decimals() uint8
        +description() string
        +version() uint256
        +getRoundData(roundId) tuple
        +latestRoundData() tuple
        #event PriceUpdated(oldPrice, newPrice)
    }

    class ERC20 {
        <<OpenZeppelin>>
    }
    class ERC20Burnable {
        <<OpenZeppelin>>
    }
    class Ownable {
        <<OpenZeppelin>>
    }
    class ReentrancyGuard {
        <<OpenZeppelin>>
    }
    class Pausable {
        <<OpenZeppelin>>
    }

    class TOTGLD {
        +uint256 MIN_CR = 150
        +uint256 MINT_FEE_BPS = 30
        +uint256 BURN_FEE_BPS = 10
        +uint256 MAX_ORACLE_STALENESS = 1h
        +AggregatorV3Interface ethUsdFeed
        +AggregatorV3Interface xauUsdFeed
        +mapping positions
        +uint256 totalProtocolFees
        +mintTOTGLD(amount) payable
        +burnTOTGLD(amount)
        +getCollateralRatio(user) uint256
        +getMaxMintable(ethWei) uint256
        +getETHReturn(totgldAmount) uint256
        +getETHPrice() uint256
        +getGoldPrice() uint256
        +withdrawFees(to) onlyOwner
        +updateOracles(ethFeed, xauFeed) onlyOwner
        +pause() onlyOwner
        +unpause() onlyOwner
    }

    class Position {
        <<struct>>
        uint256 collateralETH
        uint256 debtTOTGLD
    }

    MockOracle ..|> AggregatorV3Interface : implements
    TOTGLD --|> ERC20
    TOTGLD --|> ERC20Burnable
    TOTGLD --|> Ownable
    TOTGLD --|> ReentrancyGuard
    TOTGLD --|> Pausable
    TOTGLD --> AggregatorV3Interface : uses (ethUsdFeed / xauUsdFeed)
    TOTGLD *-- Position : positions[address]
```

---

## 2. High-Level System Overview

Shows actors, contracts, and oracle deployment strategies.

```mermaid
flowchart LR
    subgraph Actors
        User([User / DApp])
        Owner([Owner / Admin])
    end

    subgraph TOTGLD_Contract["TOTGLD Contract\n(ERC-20 + CDP Vault)"]
        Mint[mintTOTGLD\npayable]
        Burn[burnTOTGLD]
        Admin[Admin\nwithdrawFees\nupdateOracles\npause/unpause]
        Positions[(positions\nmap)]
        FeeVault[(totalProtocolFees\nETH + TOTGLD tokens)]
    end

    subgraph Oracle_Layer["Oracle Layer"]
        direction TB
        subgraph Local_Testing["Local / Sepolia Testing"]
            MO_ETH["MockOracle\nETH/USD\nsetPrice() by owner"]
            MO_XAU["MockOracle\nXAU/USD\nsetPrice() by owner"]
        end
        subgraph Production["Sepolia / Mainnet"]
            CL_ETH["Chainlink\nETH/USD\n0x694AA1..."]
            CL_XAU["Chainlink\nXAU/USD\n0x7b219F..."]
        end
    end

    User -- "ETH + amount" --> Mint
    User -- "TOTGLD amount" --> Burn
    Owner --> Admin
    Owner -- "setPrice()" --> MO_ETH
    Owner -- "setPrice()" --> MO_XAU

    Mint -- "latestRoundData()" --> MO_ETH
    Mint -- "latestRoundData()" --> MO_XAU
    Burn -- "latestRoundData()" --> MO_ETH
    Burn -- "latestRoundData()" --> MO_XAU

    Mint -- "lock collateral" --> Positions
    Burn -- "release collateral" --> Positions
    Mint -- "fee tokens" --> FeeVault
    Burn -- "fee ETH" --> FeeVault

    Admin -- "withdraw" --> FeeVault

    MO_ETH -. "swap for prod" .-> CL_ETH
    MO_XAU -. "swap for prod" .-> CL_XAU
```

---

## 3. `mintTOTGLD()` Flow

```mermaid
flowchart TD
    A([User calls mintTOTGLD\ntotgldAmount\n+ sends ETH]) --> B{msg.value == 0?}
    B -- Yes --> ERR1([revert InsufficientETH])
    B -- No --> C{totgldAmount == 0?}
    C -- Yes --> ERR2([revert ZeroAmount])
    C -- No --> D[Fetch prices\n_fetchPrices]

    D --> D1[_safePrice\nethUsdFeed]
    D --> D2[_safePrice\nxauUsdFeed]

    D1 --> D3{answer ≤ 0\nor stale > 1h?}
    D2 --> D3
    D3 -- Yes --> ERR3([revert OracleInvalidPrice\nor OracleStalePriceFeed])
    D3 -- No --> E["Calculate requiredETH\n= totgldAmount × goldPrice × MIN_CR\n  ÷ (ethPrice × 100)"]

    E --> F{msg.value\n≥ requiredETH?}
    F -- No --> ERR4([revert\nInsufficientCollateralForMint])
    F -- Yes --> G{excessETH > 0?}
    G -- Yes --> H[Refund excess ETH\nmsg.sender.call]
    G -- No --> I
    H --> I["Compute gross mint & fee\ngrossMint = totgldAmount × 10000\n           ÷ (10000 − 30)\nfeeTOTGLD = grossMint − totgldAmount"]

    I --> J["Update Position\npos.collateralETH += requiredETH\npos.debtTOTGLD   += grossMint"]

    J --> K[_mint to user\ntotgldAmount tokens]
    K --> L[_mint to contract\nfeeTOTGLD tokens]

    L --> M[Emit Minted\nEmit PositionUpdated]
    M --> Z([Done ✓])

    style A fill:#4CAF50,color:#fff
    style Z fill:#4CAF50,color:#fff
    style ERR1 fill:#F44336,color:#fff
    style ERR2 fill:#F44336,color:#fff
    style ERR3 fill:#F44336,color:#fff
    style ERR4 fill:#F44336,color:#fff
```

### Mint Formula Reference

| Variable | Formula |
|---|---|
| `requiredETH` | `totgldAmount × goldPrice × 150 ÷ (ethPrice × 100)` |
| `grossMint` | `totgldAmount × 10000 ÷ (10000 − 30)` |
| `feeTOTGLD` | `grossMint − totgldAmount` (≈ 0.30%) |
| User receives | `totgldAmount` tokens |
| Protocol retains | `feeTOTGLD` tokens |

---

## 4. `burnTOTGLD()` Flow

```mermaid
flowchart TD
    A([User calls burnTOTGLD\ntotgldAmount]) --> B{totgldAmount == 0?}
    B -- Yes --> ERR1([revert ZeroAmount])
    B -- No --> C{totgldAmount\n> pos.debtTOTGLD?}
    C -- Yes --> ERR2([revert BurnExceedsDebt])
    C -- No --> D[Fetch prices\n_fetchPrices]

    D --> D3{answer ≤ 0\nor stale > 1h?}
    D3 -- Yes --> ERR3([revert OracleInvalidPrice\nor OracleStalePriceFeed])
    D3 -- No --> E["Calculate grossETH\n= totgldAmount × goldPrice\n  ÷ ethPrice"]

    E --> F{grossETH\n> pos.collateralETH?}
    F -- Yes --> G[Cap: grossETH\n= pos.collateralETH]
    F -- No --> H
    G --> H["Apply burn fee\nfeeETH    = grossETH × 10 ÷ 10000\nreturnETH = grossETH − feeETH"]

    H --> I["Update Position\npos.debtTOTGLD    -= totgldAmount\npos.collateralETH -= grossETH"]

    I --> J{pos.debtTOTGLD == 0\nAND collateralETH > 0?}
    J -- Yes --> K["Sweep residual dust\nreturnETH += pos.collateralETH\npos.collateralETH = 0"]
    J -- No --> L
    K --> L[totalProtocolFees += feeETH]

    L --> M[_burn caller's tokens\ntotgldAmount]

    M --> N{returnETH > 0?}
    N -- Yes --> O[Transfer ETH\nmsg.sender.call]
    N -- No --> P
    O --> P[Emit Burned\nEmit PositionUpdated]
    P --> Z([Done ✓])

    style A fill:#2196F3,color:#fff
    style Z fill:#2196F3,color:#fff
    style ERR1 fill:#F44336,color:#fff
    style ERR2 fill:#F44336,color:#fff
    style ERR3 fill:#F44336,color:#fff
    style K fill:#FF9800,color:#fff
```

### Burn Formula Reference

| Variable | Formula |
|---|---|
| `grossETH` | `totgldAmount × goldPrice ÷ ethPrice` (capped at `collateralETH`) |
| `feeETH` | `grossETH × 10 ÷ 10000` (≈ 0.10%) |
| `returnETH` | `grossETH − feeETH` |
| Protocol retains | `feeETH` wei |

---

## 5. MockOracle — `setPrice()` & Data Flow

```mermaid
sequenceDiagram
    participant Owner
    participant MockOracle
    participant TOTGLD

    Note over MockOracle: Deployed with initialPrice & desc
    Owner->>MockOracle: setPrice(newPrice)
    MockOracle->>MockOracle: require(newPrice > 0)
    MockOracle->>MockOracle: emit PriceUpdated(old, new)
    MockOracle->>MockOracle: _price = newPrice; _roundId++

    Note over TOTGLD: On mintTOTGLD / burnTOTGLD
    TOTGLD->>MockOracle: latestRoundData()
    MockOracle-->>TOTGLD: (_roundId, _price, block.timestamp, block.timestamp, _roundId)
    TOTGLD->>TOTGLD: validate: answer > 0, not stale
```

---

## 6. Collateral & Fee Summary

```mermaid
flowchart LR
    subgraph Mint["Mint (ETH → TOTGLD)"]
        direction TB
        ME[ETH sent by user] --> ML[locked in position]
        ME --> MR[excess refunded]
        MF[TOTGLD gross] --> MU[net to user]
        MF --> MC[fee to contract\n0.30%]
    end

    subgraph Burn["Burn (TOTGLD → ETH)"]
        direction TB
        BT[TOTGLD burned] --> BG[grossETH calculated]
        BG --> BR[ETH returned to user]
        BG --> BF[fee to protocol\n0.10%]
    end

    subgraph Protocol_Fees["Protocol Fee Vault"]
        PF1[TOTGLD fee tokens]
        PF2[ETH fee accumulator\ntotalProtocolFees]
    end

    MC --> PF1
    BF --> PF2
    PF1 --> W[withdrawFees\nonlyOwner]
    PF2 --> W
```

---

## Key Constants

| Constant | Value | Meaning |
|---|---|---|
| `MIN_CR` | 150 | 150% minimum collateral ratio |
| `MINT_FEE_BPS` | 30 | 0.30% mint fee |
| `BURN_FEE_BPS` | 10 | 0.10% burn fee |
| `MAX_ORACLE_STALENESS` | 3600s | Oracle data must be < 1 hour old |
| `PRICE_PRECISION` | 1e8 | Chainlink 8-decimal price scale |
