// import { default as NounsAuctionHouseABI } from '../abi/contracts/NounsAuctionHouse.sol/NounsAuctionHouse.json';
import { Interface } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';
import promptjs from 'prompt';

promptjs.colors = false;
promptjs.message = '> ';
promptjs.delimiter = '';

type ContractName =
  | 'NFTDescriptor'
  | 'RadaDescriptor'
  | 'RadaSeeder'
  | 'RadaToken'
  // | 'NounsAuctionHouse'
  // | 'NounsAuctionHouseProxyAdmin'
  // | 'NounsAuctionHouseProxy'
  ;

interface Contract {
  args?: (string | number | (() => string | undefined))[];
  address?: string;
  libraries?: () => Record<string, string>;
  waitForConfirmation?: boolean;
}

task('deploy', 'Deploys NFTDescriptor, RadaDescriptor, RadaSeeder, and RadaToken')
  .addParam('wbnb', 'The WBNB contract address', undefined, types.string)
  /* .addParam('noundersdao', 'The nounders DAO contract address', undefined, types.string)
  .addOptionalParam('auctionTimeBuffer', 'The auction time buffer (seconds)', 5 * 60, types.int)
  .addOptionalParam('auctionReservePrice', 'The auction reserve price (wei)', 1, types.int)
  .addOptionalParam(
    'auctionMinIncrementBidPercentage',
    'The auction min increment bid percentage (out of 100)',
    5,
    types.int,
  )
  .addOptionalParam('auctionDuration', 'The auction duration (seconds)', 60 * 60 * 24, types.int) // Default: 24 hours
  .addOptionalParam('timelockDelay', 'The timelock delay (seconds)', 60 * 60 * 24 * 2, types.int) // Default: 2 days */
  /* .addOptionalParam('votingPeriod', 'The voting period (blocks)', 4 * 60 * 24 * 3, types.int) // Default: 3 days
  .addOptionalParam('votingDelay', 'The voting delay (blocks)', 1, types.int) // Default: 1 block
  .addOptionalParam('proposalThresholdBps', 'The proposal threshold (basis points)', 500, types.int) // Default: 5%
  .addOptionalParam('quorumVotesBps', 'Votes required for quorum (basis points)', 1_000, types.int) // Default: 10% */
  .setAction(async (args, { ethers }) => {
    const network = await ethers.provider.getNetwork();
    /* const proxyRegistryAddress =
      network.chainId === 1
        ? '0xa5409ec958c83c3f309868babaca7c86dcb077c1'
        : '0xf57b2c51ded3a29e6891aba85459d600256cf317'; */

    const AUCTION_HOUSE_PROXY_NONCE_OFFSET = 6;
    const GOVERNOR_N_DELEGATOR_NONCE_OFFSET = 9;

    const [deployer] = await ethers.getSigners();
    const nonce = await deployer.getTransactionCount();

    const expectedNounsDAOProxyAddress = ethers.utils.getContractAddress({
      from: deployer.address,
      nonce: nonce + GOVERNOR_N_DELEGATOR_NONCE_OFFSET,
    });
    const contracts: Record<ContractName, Contract> = {
      NFTDescriptor: {},
      RadaDescriptor: {
        libraries: () => ({
          NFTDescriptor: contracts['NFTDescriptor'].address as string,
        }),
      },
      RadaSeeder: {},
      RadaToken: {
        args: [
          // args.noundersdao,
          deployer.address,
          () => contracts['RadaDescriptor'].address,
          () => contracts['RadaSeeder'].address,
          // proxyRegistryAddress,
        ],
      },
      /* NounsAuctionHouse: {
        waitForConfirmation: true,
      },
      NounsAuctionHouseProxyAdmin: {},
      NounsAuctionHouseProxy: {
        args: [
          () => contracts['NounsAuctionHouse'].address,
          () => contracts['NounsAuctionHouseProxyAdmin'].address,
          () =>
            new Interface(NounsAuctionHouseABI).encodeFunctionData('initialize', [
              contracts['NounsToken'].address,
              args.wbnb,
              args.auctionTimeBuffer,
              args.auctionReservePrice,
              args.auctionMinIncrementBidPercentage,
              args.auctionDuration,
            ]),
        ],
      }, */
      /* NounsDAOExecutor: {
        args: [expectedNounsDAOProxyAddress, args.timelockDelay],
      },
      NounsDAOLogicV1: {
        waitForConfirmation: true,
      },
      NounsDAOProxy: {
        args: [
          () => contracts['NounsDAOExecutor'].address,
          () => contracts['NounsToken'].address,
          args.noundersdao,
          () => contracts['NounsDAOExecutor'].address,
          () => contracts['NounsDAOLogicV1'].address,
          args.votingPeriod,
          args.votingDelay,
          args.proposalThresholdBps,
          args.quorumVotesBps,
        ],
      }, */
    };

    let gasPrice = await ethers.provider.getGasPrice();
    const gasInGwei = Math.round(Number(ethers.utils.formatUnits(gasPrice, 'gwei')));

    promptjs.start();

    let result = await promptjs.get([
      {
        properties: {
          gasPrice: {
            type: 'integer',
            required: true,
            description: 'Enter a gas price (gwei)',
            default: gasInGwei,
          },
        },
      },
    ]);

    gasPrice = ethers.utils.parseUnits(result.gasPrice.toString(), 'gwei');

    for (const [name, contract] of Object.entries(contracts)) {
      const factory = await ethers.getContractFactory(name, {
        libraries: contract?.libraries?.(),
      });

      const deploymentGas = await factory.signer.estimateGas(
        factory.getDeployTransaction(
          ...(contract.args?.map(a => (typeof a === 'function' ? a() : a)) ?? []),
          {
            gasPrice,
          },
        ),
      );
      const deploymentCost = deploymentGas.mul(gasPrice);

      console.log(
        `Estimated cost to deploy ${name}: ${ethers.utils.formatUnits(
          deploymentCost,
          'ether',
        )} BNB`,
      );

      result = await promptjs.get([
        {
          properties: {
            confirm: {
              type: 'string',
              description: 'Type "DEPLOY" to confirm:',
            },
          },
        },
      ]);

      if (result.confirm != 'DEPLOY') {
        console.log('Exiting');
        return;
      }

      console.log('Deploying...');

      const deployedContract = await factory.deploy(
        ...(contract.args?.map(a => (typeof a === 'function' ? a() : a)) ?? []),
        {
          gasPrice,
        },
      );

      if (contract.waitForConfirmation) {
        await deployedContract.deployed();
      }

      contracts[name as ContractName].address = deployedContract.address;

      console.log(`${name} contract deployed to ${deployedContract.address}`);
    }

    return contracts;
  });
