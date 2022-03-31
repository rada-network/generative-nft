const { upgrades, hardhatArguments } = require('hardhat');
const { addresses: tokenAddresses } = require('./proxyAddresses');
const { addresses: addressDescriptor } = require('../RadaDescriptor/proxyAddresses');
const { addresses: addressSeeder } = require('../RadaSeeder/proxyAddresses');
async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const contractAddress = tokenAddresses[network];

  console.log("Contract address is:", contractAddress);
  const implementedAddress = await upgrades.erc1967.getImplementationAddress(contractAddress);

  await hre.run("verify:verify", {
    address: implementedAddress,
    constructorArguments: [],
  });

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });