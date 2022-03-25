/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HardhatUserConfig } from 'hardhat/config';
import dotenv from 'dotenv';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import '@float-capital/solidity-coverage';
import 'hardhat-typechain';
import 'hardhat-abi-exporter';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-gas-reporter';
import './tasks';

dotenv.config({ path: (process.argv.includes('mainnet')) ? '.env.mainnet' : '.env' });

const BSC_API_KEY = process.env.BSC_API_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 10_000,
      },
    },
  },
  networks: {
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      // gas: 2100000,
      // gasPrice: 20000000000,
      accounts: process.env.MNEMONIC
        ? { mnemonic: process.env.MNEMONIC }
        : [process.env.WALLET_PRIVATE_KEY!].filter(Boolean)
    },
    mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      // gas: 2100000,
      // gasPrice: 20000000000,
      accounts: process.env.MNEMONIC
        ? { mnemonic: process.env.MNEMONIC }
        : [process.env.WALLET_PRIVATE_KEY!].filter(Boolean)
    },
    hardhat: {
      initialBaseFeePerGas: 0,
    },
  },
  etherscan: {
    apiKey: BSC_API_KEY,
  },
  abiExporter: {
    path: './abi',
    runOnCompile: true,
    clear: true,
    except: ["@openzeppelin"]
  },
  gasReporter: {
    token: "BNB",
    enabled: !process.env.CI,
    currency: 'USD',
    gasPrice: 50,
    src: 'contracts',
    coinmarketcap: '7643dfc7-a58f-46af-8314-2db32bdd18ba',
  },
  mocha: {
    timeout: 50000000,
  },
};
export default config;
