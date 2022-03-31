
import { default as RadaAuctionHouseABI } from '../abi/contracts/RadaAuctionHouse.sol/RadaAuctionHouse.json';
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
  | 'RadaAuctionHouse'
  ;

interface Contract {
  args?: (string | number | (() => string | undefined))[];
  address?: string;
  libraries?: () => Record<string, string>;
  waitForConfirmation?: boolean;
  isProxy?: boolean;
}

task('deploy', 'Deploys NFTDescriptor, RadaDescriptor, RadaSeeder, and RadaToken')
  .addParam('wbnb', 'The WBNB contract address', undefined, types.string)
  /* .addParam('noundersdao', 'The nounders DAO contract address', undefined, types.string) */
  .addOptionalParam('auctionTimeBuffer', 'The auction time buffer (seconds)', 5 * 60, types.int)
  .addOptionalParam('auctionReservePrice', 'The auction reserve price (wei)', 1, types.int)
  .addOptionalParam(
    'auctionMinIncrementBidPercentage',
    'The auction min increment bid percentage (out of 100)',
    5,
    types.int,
  )
  .addOptionalParam('auctionDuration', 'The auction duration (seconds)', 60 * 60 * 24, types.int) // Default: 24 hours
  .setAction(async (args, {ethers, upgrades}) => {
    const network = await ethers.provider.getNetwork();

    const [deployer] = await ethers.getSigners();
    const nonce = await deployer.getTransactionCount();

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
          deployer.address,
          () => contracts['RadaDescriptor'].address,
          () => contracts['RadaSeeder'].address,
        ],
      },
      RadaAuctionHouse: {
        waitForConfirmation: true,
        isProxy: true,
        args: [
          () => contracts['RadaToken'].address,
          args.wbnb,
          args.auctionTimeBuffer,
          args.auctionReservePrice,
          args.auctionMinIncrementBidPercentage,
          args.auctionDuration,
        ],
      },
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
        contract.isProxy ? factory.getDeployTransaction() : factory.getDeployTransaction(
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


      const deployedContract = contract.isProxy ? await upgrades.deployProxy(
          factory,
          (contract.args?.map(a => (typeof a === 'function' ? a() : a)) ?? []),
          {
            kind: 'uups'
          },
        ) : await factory.deploy(
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
      if (contract.isProxy) {
        const implementedAddress = await upgrades.erc1967.getImplementationAddress(deployedContract.address);
        console.log(`${name} implemented contract deployed to ${implementedAddress}`);
      }
    }

    return contracts;
  });
