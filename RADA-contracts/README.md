# Generative NFT

## Development

### Install dependencies

```sh
yarn
```

### Compile typescript, contracts, and generate typechain wrappers

```sh
yarn build
```

### Run tests

```sh
yarn test
```

### Environment Setup

Copy `.env.example` to `.env` and fill in fields

### Commands

```sh
# Build
yarn build

# Testing with local node
yarn task:run-local

# Deploying
yarn task:deploy-ci --network testnet

# Save addresses from logs to verify-etherscan.ts
yarn task:verify-contracts --network testnet

# Populate descriptor from ./files/image-data.json
yarn task:populate-descriptor --network testnet

# Mint new NFT
yarn task:mint-noun --network testnet

```

```sh
# DEBUG, NO USE
npx hardhat run scripts/RadaDescriptor/1_deploy.js --network testnet
npx hardhat run scripts/RadaSeeder/1_deploy.js --network testnet
npx hardhat run scripts/RadaToken/1_deploy.js --network testnet

# Verify
npx hardhat run scripts/RadaDescriptor/verify.js --network testnet
npx hardhat run scripts/RadaSeeder/verify.js --network testnet
npx hardhat run scripts/RadaToken/verify.js --network testnet
npx hardhat run scripts/RadaAuctionHouse/verify.js --network testnet

```

## DEMO

```sh

DEBUG SET duration 5min


```
