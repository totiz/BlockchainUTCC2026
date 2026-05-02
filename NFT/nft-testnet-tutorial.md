# Deploying Your First NFT to Sepolia Testnet

**Course handout — Blockchain @ UTCC**
*From zero to viewing your NFT on OpenSea*

---

## Learning Objectives

By the end of this lab, students will be able to:
1. Write an ERC-721 smart contract using OpenZeppelin
2. Pin image + metadata to IPFS (Pinata)
3. Deploy a contract to Sepolia testnet using Hardhat
4. Mint an NFT to their own wallet
5. View the NFT on `testnets.opensea.io`

**Estimated time:** 90–120 minutes

---

## Prerequisites

- Node.js v18 or v20 installed (`node -v` to check)
- A code editor (VS Code recommended)
- Basic JavaScript and command line familiarity
- A Google or email account for Pinata signup

---

## Stack Overview

| Layer | Tool | Why |
|---|---|---|
| Wallet | MetaMask | Standard Web3 wallet |
| Network | Sepolia | Active Ethereum testnet (Goerli is deprecated) |
| Contract framework | Hardhat | Most popular dev framework |
| Contract library | OpenZeppelin v5 | Audited ERC-721 implementation |
| Storage | Pinata (IPFS) | Free tier, simple UI |
| Marketplace | testnets.opensea.io | Where students see the result |
| RPC provider | Alchemy or public RPC | Connection to Sepolia |

---

## Step 1 — Set Up MetaMask & Get Sepolia ETH

### 1.1 Install MetaMask
- Browser extension from [metamask.io](https://metamask.io)
- Create a new wallet **for class use only** — never use a real-money wallet for testnet experiments
- Save the seed phrase (even though it's testnet, it's a good habit)

### 1.2 Add Sepolia network
MetaMask now shows test networks by default. If not:
- Settings → Advanced → Show test networks → ON
- Switch network dropdown → Sepolia

### 1.3 Get Sepolia ETH (faucet)
Students need ~0.05 SepoliaETH. Recommended faucets:

- **Google Cloud Web3 Faucet** — `cloud.google.com/application/web3/faucet/ethereum/sepolia` (no mainnet balance required)
- **Alchemy Sepolia Faucet** — `sepoliafaucet.com` (requires Alchemy signup)
- **PoW Faucet** — `sepolia-faucet.pk910.de` (mine in browser if other faucets fail)

> **Teaching tip:** Faucets often rate-limit. Have students try faucets *before* class starts, or pre-distribute test ETH from your own funded wallet.

---

## Step 2 — Initialize Hardhat Project

Open terminal:

```bash
mkdir my-nft && cd my-nft
npm init -y
npm install --save-dev hardhat
npx hardhat init
```

Choose **"Create a JavaScript project"** → accept defaults.

Then install dependencies:

```bash
npm install @openzeppelin/contracts dotenv
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

Project structure:
```
my-nft/
├── contracts/
├── scripts/
├── test/
├── hardhat.config.js
└── package.json
```

---

## Step 3 — Write the ERC-721 Contract

Create `contracts/MyNFT.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor(address initialOwner)
        ERC721("UTCC Blockchain NFT", "UTCC")
        Ownable(initialOwner)
    {}

    function safeMint(address to, string memory uri)
        public
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }
}
```

**Concepts to discuss with students:**
- `ERC721URIStorage` lets each token have its own metadata URI
- `Ownable` restricts minting to the deployer (good security practice)
- `_nextTokenId++` auto-increments token IDs starting at 0
- Why `_safeMint` instead of `_mint`? (it checks the receiver can handle ERC-721)

Compile to verify:
```bash
npx hardhat compile
```

---

## Step 4 — Prepare Image and Metadata on IPFS

### 4.1 Pick an image
Anything works — a logo, a meme, an AI-generated image. Keep it under 1 MB for fast pinning.

### 4.2 Sign up at [pinata.cloud](https://pinata.cloud)
Free tier is fine.

### 4.3 Upload the image
- Pinata dashboard → **Upload** → **File**
- Copy the **CID** (looks like `bafybeig...` or `Qm...`)
- Image URL becomes: `ipfs://<CID>`

### 4.4 Create metadata JSON
Save locally as `metadata.json`:

```json
{
  "name": "UTCC Blockchain NFT #1",
  "description": "Created by [Student Name] for the UTCC Blockchain course.",
  "image": "ipfs://<YOUR_IMAGE_CID>",
  "attributes": [
    { "trait_type": "Course", "value": "Blockchain 101" },
    { "trait_type": "Semester", "value": "2026-1" },
    { "trait_type": "Rarity", "value": "Common" }
  ]
}
```

### 4.5 Upload metadata.json to Pinata
- Upload File → select `metadata.json`
- Copy **this CID** — this is what we'll pass to `safeMint`
- Final token URI: `ipfs://<METADATA_CID>`

> **Teaching tip:** Show students the metadata JSON schema is **not part of the ERC-721 standard itself** — it's a convention popularized by OpenSea. This is why `image`, `attributes`, etc. have specific names.

---

## Step 5 — Configure Hardhat for Sepolia

### 5.1 Get Sepolia RPC URL
Sign up at [alchemy.com](https://alchemy.com) → create a new app → Network: Ethereum, Chain: Sepolia → copy HTTPS URL.

(Alternatively, use a public RPC like `https://rpc.sepolia.org` — less reliable but no signup.)

### 5.2 Export your wallet private key
MetaMask → click the 3 dots → Account details → Show private key.

> ⚠️ **Critical security warning for students:** Never commit private keys to GitHub. Never reuse a private key from a real-funds wallet. The class wallet should be **testnet only.**

### 5.3 Create `.env` file in project root

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0xyour_metamask_private_key
ETHERSCAN_API_KEY=your_etherscan_key_for_verification
```

### 5.4 Add `.gitignore`
```
node_modules
.env
artifacts
cache
```

### 5.5 Update `hardhat.config.js`

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

---

## Step 6 — Deploy the Contract

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.deploy(deployer.address);
  await nft.waitForDeployment();

  const address = await nft.getAddress();
  console.log("MyNFT deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Run deploy:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Expected output:
```
Deploying with: 0xAbc...
MyNFT deployed to: 0x123...
```

**Save the contract address** — students will need it for minting and OpenSea.

---

## Step 7 — Verify Contract on Etherscan (Recommended)

Get a free API key at [etherscan.io](https://etherscan.io) → API Keys.

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <DEPLOYER_ADDRESS>
```

This makes the source code visible on Sepolia Etherscan — useful for OpenSea metadata recognition and great for teaching transparency.

---

## Step 8 — Mint the NFT

Create `scripts/mint.js`:

```javascript
const hre = require("hardhat");

const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_ADDRESS";
const TOKEN_URI = "ipfs://YOUR_METADATA_CID";

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const nft = await hre.ethers.getContractAt("MyNFT", CONTRACT_ADDRESS, signer);

  const tx = await nft.safeMint(signer.address, TOKEN_URI);
  console.log("Mint tx:", tx.hash);
  const receipt = await tx.wait();
  console.log("Minted in block:", receipt.blockNumber);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
```

Run:
```bash
npx hardhat run scripts/mint.js --network sepolia
```

The first NFT will have **token ID 0**.

---

## Step 9 — View on OpenSea Testnet

1. Open [https://testnets.opensea.io](https://testnets.opensea.io)
2. Connect MetaMask (top right) — make sure you're on Sepolia
3. Click your profile → **Profile** → you should see your NFT under "Collected"

Alternatively, view it directly by URL:
```
https://testnets.opensea.io/assets/sepolia/<CONTRACT_ADDRESS>/<TOKEN_ID>
```

### If the image doesn't appear:
- Click **Refresh metadata** on the NFT page
- Wait 1–5 minutes; OpenSea fetches IPFS asynchronously
- Verify the metadata JSON URL works in a browser using a gateway:
  `https://gateway.pinata.cloud/ipfs/<METADATA_CID>`
- Check that the `image` field uses `ipfs://...` (not a broken local path)

---

## Common Issues & Fixes

| Symptom | Cause | Fix |
|---|---|---|
| `insufficient funds` on deploy | No Sepolia ETH | Use faucet again |
| `nonce too high` | MetaMask local nonce out of sync | Settings → Advanced → Clear activity tab data |
| Contract compiles but won't deploy | RPC URL wrong | Test with `curl <RPC_URL>` |
| NFT shows but no image | IPFS metadata not propagated yet | Wait, then click Refresh metadata |
| OpenSea says "unidentified contract" | OpenSea hasn't indexed it yet | Mint at least one token; wait ~10 min |
| `Ownable: caller is not the owner` | You're minting from the wrong wallet | Check `PRIVATE_KEY` matches deployer |

---

## Discussion Questions for Students

1. **Why is the metadata stored on IPFS instead of on-chain?**
   *(Hint: gas costs, immutability tradeoffs)*

2. **What happens to the NFT if Pinata shuts down?**
   *(Pinning != permanence — discuss Filecoin, Arweave alternatives)*

3. **Could a malicious contract owner change the image after minting?**
   *(Yes — `_setTokenURI` can be called again. Discuss `freeze` patterns.)*

4. **How would you make this contract mintable by anyone, with payment?**
   *(Add `payable`, remove `onlyOwner`, add a `mintPrice` state variable)*

5. **What does "deploying to Sepolia" actually mean at the protocol level?**
   *(Submitting a transaction with empty `to` field and contract bytecode in `data`)*

---

## Optional Extensions

For students who finish early:

- **Mint a 5-NFT collection** with different metadata files
- **Add a `maxSupply`** check inside `safeMint`
- **Make it public mintable** with `payable` and a price of 0.001 SepoliaETH
- **Deploy the same contract on Polygon Amoy testnet** and compare gas costs
- **Use Pinata's pinJSONToIPFS API** to upload metadata programmatically instead of via UI

---

## Reference Links

- Hardhat docs — `hardhat.org/docs`
- OpenZeppelin Contracts Wizard — `wizard.openzeppelin.com`
- ERC-721 standard — `eips.ethereum.org/EIPS/eip-721`
- OpenSea metadata standard — `docs.opensea.io/docs/metadata-standards`
- Sepolia Etherscan — `sepolia.etherscan.io`
- testnets.opensea.io

---

*Prepared for UTCC Blockchain course. Do not share private keys. Use a dedicated testnet wallet only.*
