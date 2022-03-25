const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: addressDescriptor } = require('../NFTDescriptor/proxyAddresses');
const { addresses: addressSeeder } = require('../RadaSeeder/proxyAddresses');

const { pe,fe,fu,pu } = require('../utils');

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hardhatArguments.network;

  const contractName = "RadaToken";

  console.log("Deploying contracts with the account:", deployer.address);
  const beforeDeploy = fe(await deployer.getBalance());

  const contractFactory = await ethers.getContractFactory(contractName);

  // Deploy
  // const contractDeploy = await upgrades.deployProxy(contractFactory, [], { kind: 'uups' });
  const contractDeploy = await contractFactory.deploy(deployer.address, addressDescriptor[network], addressSeeder[network]);

  await contractDeploy.deployed();
  const txHash = contractDeploy.deployTransaction.hash;
  console.log(`Tx hash: ${txHash}\nWaiting for transaction to be mined...`);
  const txReceipt = await ethers.provider.waitForTransaction(txHash);
  const contractAddress = txReceipt.contractAddress
  console.log("Contract deployed to:", contractAddress);

  const afterDeploy = fe(await deployer.getBalance());
  console.log("Cost deploy:", (beforeDeploy-afterDeploy));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });