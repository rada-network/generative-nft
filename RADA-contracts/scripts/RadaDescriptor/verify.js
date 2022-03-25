const { upgrades, hardhatArguments } = require('hardhat');
const { addresses: contractAddresses } = require('./proxyAddresses');
async function main() {

  const network = hardhatArguments.network;
  const contractAddress = contractAddresses[network];

  console.log("Contract address is:", contractAddress);

  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [],
  });

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });