import { task } from 'hardhat/config';

type ContractName =
  | 'NFTDescriptor'
  | 'RadaDescriptor'
  | 'RadaSeeder'
  | 'RadaToken'
  /* | 'RadaAuctionHouse'
  | 'RadaAuctionHouseProxyAdmin'
  | 'RadaAuctionHouseProxy'
  */
  /* | 'RadaDAOExecutor'
  | 'RadaDAOLogicV1'
  | 'RadaDAOProxy' */
  ;

interface VerifyArgs {
  address: string;
  constructorArguments?: (string | number)[];
  libraries?: Record<string, string>;
}

const contracts: Record<ContractName, VerifyArgs> = {
  NFTDescriptor: {
    address: '0x09a919B1e29522d7c6168Fb866C314DF651e495a',
  },
  RadaDescriptor: {
    address: '0x1a6D212A141a40c2B7E2fc6EEdf1Ea88Be0FaD41',
    libraries: {
      NFTDescriptor: '0x09a919B1e29522d7c6168Fb866C314DF651e495a',
    },
  },
  RadaSeeder: {
    address: '0x64FdEE4df0283498B959eb77eA8561D19A89aF90',
  },
  RadaToken: {
    address: '0x9E4C3917EaBCAA524F57715b388fa9fC9E36e906',
    constructorArguments: [
      '0x16DA4c7B28dc30BCE9e2B384E17a7b0078Fb97AE',
      '0x1a6D212A141a40c2B7E2fc6EEdf1Ea88Be0FaD41',
      '0x64FdEE4df0283498B959eb77eA8561D19A89aF90',
    ],
  },
  /* RadaAuctionHouse: {
    address: '0xF15a943787014461d94da08aD4040f79Cd7c124e',
  },
  RadaAuctionHouseProxyAdmin: {
    address: '0xC1C119932d78aB9080862C5fcb964029f086401e',
  },
  RadaAuctionHouseProxy: {
    address: '0x830BD73E4184ceF73443C15111a1DF14e495C706',
    constructorArguments: [
      '0x2C128FF70de543A3d20f56a8241a6a1E6541C7BA',
      '0x4cF3a897D8B3D854B87875882278B4c09dDA40c9',
      '0x87f49f540000000000000000000000009C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000012c00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000001518',
    ],
  }, */
  /* RadaDAOExecutor: {
    address: '0x0BC3807Ec262cB779b38D65b38158acC3bfedE10',
    constructorArguments: ['0x6f3E6272A167e8AcCb32072d08E0957F9c79223d', 172800],
  },
  RadaDAOLogicV1: {
    address: '0xa43aFE317985726E4e194eb061Af77fbCb43F944',
  },
  RadaDAOProxy: {
    address: '0x6f3E6272A167e8AcCb32072d08E0957F9c79223d',
    constructorArguments: [
      '0x0BC3807Ec262cB779b38D65b38158acC3bfedE10',
      '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03',
      '0x2573C60a6D127755aA2DC85e342F7da2378a0Cc5',
      '0x0BC3807Ec262cB779b38D65b38158acC3bfedE10',
      '0xa43aFE317985726E4e194eb061Af77fbCb43F944',
      19710,
      13140,
      500,
      1000,
    ],
  }, */
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
