import { task } from 'hardhat/config';

type ContractName =
  | 'NFTDescriptor'
  | 'RadaDescriptor'
  | 'RadaSeeder'
  | 'RadaToken'
  | 'RadaAuctionHouse'
  ;

interface VerifyArgs {
  address: string;
  constructorArguments?: (string | number)[];
  libraries?: Record<string, string>;
}

const contracts: Record<ContractName, VerifyArgs> = {
  NFTDescriptor: {
    address: '0xCa95d3b10408eda242ED52aF8F695fd59d3E5A51',
  },
  RadaDescriptor: {
    address: '0x8b638Dd12a438fBC7a2ea01116dF7c20CD41C8b0',
    libraries: {
      NFTDescriptor: '0xCa95d3b10408eda242ED52aF8F695fd59d3E5A51',
    },
  },
  RadaSeeder: {
    address: '0xD6a9333c8eaE4c949e091d0dfE69beBE12C9C983',
  },
  RadaToken: {
    address: '0x3B13Bd240Ae7A2dbb9F6F1961a666C3f96551f64',
    constructorArguments: [
      '0x16DA4c7B28dc30BCE9e2B384E17a7b0078Fb97AE', // 0x8eA5A39A59906719853d64EcF2ef2cB9ffA4E4dF
      '0x8b638Dd12a438fBC7a2ea01116dF7c20CD41C8b0',
      '0xD6a9333c8eaE4c949e091d0dfE69beBE12C9C983',
    ],
  },
  RadaAuctionHouse: {
    address: '0x9D3e3640e9F9149dF00d5987Da72B6bD023Cd42E',
  },
};

task('verify-contracts', 'Verify the Solidity contracts on Etherscan').setAction(async (_, hre) => {
  for (const [name, args] of Object.entries(contracts)) {
    console.log(`verifying ${name}...`);
    try {
      await hre.run('verify:verify', {
        ...args,
      });
    } catch (e) {
      console.error(e);
    }
  }
});
