This Product Requirements Document (PRD) outlines the architecture and functionality for your **"Simple Bank"** smart contract, tailored for your work at Orbix Tech.

---

# PRD: Simple Bank Smart Contract

## 1. Executive Summary
A decentralized "Simple Bank" contract that manages user deposits, withdrawals, and an administrative layer for system liquidity management and dividend distribution.

## 2. User Roles & Permissions
| Role | Responsibility |
| :--- | :--- |
| **Admin** | Manages system liquidity (deposit/withdraw) and triggers dividend payments to users. |
| **User** | Interacts with their own account to deposit funds and withdraw their holdings. |

## 3. Functional Requirements

### 3.1 Admin Functions
* **`depositToSystem(uint256 amount)`**: Allows the Admin to inject liquidity into the bank contract.
* **`withdrawFromSystem(uint256 amount)`**: Allows the Admin to remove excess liquidity from the contract.
* **`payDividends(address[] calldata recipients, uint256[] calldata amounts)`**: Allows the Admin to distribute dividends to a list of users simultaneously.

### 3.2 User Functions
* **`deposit()`**: Allows users to send Ether/Tokens to the contract to be credited to their internal balance.
* **`withdraw(uint256 amount)`**: Allows users to withdraw their deposited funds (and dividends) back to their personal wallet.
* **`getBalance(address user)`**: View function to check current account standing.

## 4. Technical Constraints & Security
* **Reentrancy Protection**: Utilize `ReentrancyGuard` from OpenZeppelin for all withdrawal functions.
* **Access Control**: Utilize `Ownable` to ensure only the authorized Admin address can trigger administrative functions.
* **Events**: All critical state changes (deposits, withdrawals, dividend distributions) must emit events for off-chain indexing.

---

## 5. Proposed Solidity Structure (Draft)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleBank is Ownable, ReentrancyGuard {
    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event DividendPaid(address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {}

    // User Functions
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    // Admin Functions
    function depositToSystem() external payable onlyOwner {}

    function withdrawFromSystem(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }

    function payDividends(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Mismatched arrays");
        for (uint i = 0; i < recipients.length; i++) {
            balances[recipients[i]] += amounts[i];
            emit DividendPaid(recipients[i], amounts[i]);
        }
    }
}
```

---

## 6. Development Roadmap
1.  **Phase 1**: Setup development environment (Hardhat/Foundry).
2.  **Phase 2**: Implement core contract logic and unit tests using mock addresses.
3.  **Phase 3**: Security audit for reentrancy and integer overflow/underflow.
4.  **Phase 4**: Deploy to testnet (Sepolia/Holesky) for integration testing.

---

Would you like me to expand on the gas optimization strategies for the `payDividends` function, or perhaps draft a test suite for these functions?