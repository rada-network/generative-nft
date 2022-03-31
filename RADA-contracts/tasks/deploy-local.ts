import { default as RadaAuctionHouseABI } from '../abi/contracts/RadaAuctionHouse.sol/RadaAuctionHouse.json';

import { task, types } from 'hardhat/config';
import { Interface } from 'ethers/lib/utils';

import { Contract as EthersContract } from 'ethers';

type ContractName =
  | 'WBNB'
  | 'NFTDescriptor'
  | 'RadaDescriptor'
  | 'RadaSeeder'
  | 'RadaToken'
  | 'RadaAuctionHouse'
  ;

interface Contract {
  args?: (string | number | (() => string | undefined))[];
  instance?: EthersContract;
  libraries?: () => Record<string, string>;
  waitForConfirmation?: boolean;
  isProxy?: boolean;
}

task('deploy-local', 'Deploy contracts to hardhat')
  .addOptionalParam('auctionTimeBuffer', 'The auction time buffer (seconds)', 30, types.int) // Default: 30 seconds
  .addOptionalParam('auctionReservePrice', 'The auction reserve price (wei)', 1, types.int) // Default: 1 wei
  .addOptionalParam(
    'auctionMinIncrementBidPercentage',
    'The auction min increment bid percentage (out of 100)', // Default: 5%
    5,
    types.int,
  )
  .addOptionalParam('auctionDuration', 'The auction duration (seconds)', 60 * 2, types.int) // Default: 2 minutes
  .setAction(async (args, { ethers, upgrades }) => {
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 31337) {
      console.log(`Invalid chain id. Expected 31337. Got: ${network.chainId}.`);
      return;
    }

    const proxyRegistryAddress = '0xa5409ec958c83c3f309868babaca7c86dcb077c1';

    const AUCTION_HOUSE_PROXY_NONCE_OFFSET = 7;
    const GOVERNOR_N_DELEGATOR_NONCE_OFFSET = 10;

    const [deployer] = await ethers.getSigners();
    const nonce = await deployer.getTransactionCount();
    const expectedNounsDAOProxyAddress = ethers.utils.getContractAddress({
      from: deployer.address,
      nonce: nonce + GOVERNOR_N_DELEGATOR_NONCE_OFFSET,
    });
    const expectedAuctionHouseProxyAddress = ethers.utils.getContractAddress({
      from: deployer.address,
      nonce: nonce + AUCTION_HOUSE_PROXY_NONCE_OFFSET,
    });
    const contracts: Record<ContractName, Contract> = {
      WBNB: {},
      NFTDescriptor: {},
      RadaDescriptor: {
        libraries: () => ({
          NFTDescriptor: contracts['NFTDescriptor'].instance?.address as string,
        }),
      },
      RadaSeeder: {},
      RadaToken: {
        args: [
          expectedAuctionHouseProxyAddress,
          () => contracts['RadaDescriptor'].instance?.address,
          () => contracts['RadaSeeder'].instance?.address,
        ],
      },
      RadaAuctionHouse: {
        waitForConfirmation: true,
        isProxy: true,
        args: [
            () => contracts['RadaToken'].instance?.address,
            () => contracts['WBNB'].instance?.address,
            args.auctionTimeBuffer,
            args.auctionReservePrice,
            args.auctionMinIncrementBidPercentage,
            args.auctionDuration,
        ],
      },
    };

    for (const [name, contract] of Object.entries(contracts)) {
      const factory = await ethers.getContractFactory(name, {
        libraries: contract?.libraries?.(),
      });

      /* const deployedContract = await factory.deploy(
        ...(contract.args?.map(a => (typeof a === 'function' ? a() : a)) ?? []),
      ); */
      const deployedContract =  contract.isProxy ? await upgrades.deployProxy(
        factory,
        (contract.args?.map(a => (typeof a === 'function' ? a() : a)) ?? []),
        {
          kind: 'uups'
        },
      ) : await factory.deploy(
        ...(contract.args?.map(a => (typeof a === 'function' ? a() : a)) ?? []),
      );

      if (contract.waitForConfirmation) {
        await deployedContract.deployed();
      }

      contracts[name as ContractName].instance = deployedContract;

      console.log(`${name} contract deployed to ${deployedContract.address}`);
    }

    return contracts;
  });
