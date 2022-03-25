const { ethers, upgrades, hardhatArguments } = require('hardhat');
import ImageData from '../files/image-data.json';

const { addresses: contractAddress } = require('./proxyAddresses');
const { addresses: libraryAddress } = require('./libraryAddresses');

const { pe,fe,fu,pu } = require('../../utils');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const descriptorAddress = contractAddress[network];

  console.log("With the account:", deployer.address);
  console.log("NFT Descriptor", descriptorAddress);

  const descriptorContract = await ethers.getContractAt("RadaDescriptor",descriptorAddress);

  for (const addr of topUpList) {
    await tokenContract.transfer(addr,tokenTopUp)
  }

  console.log("Success");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });