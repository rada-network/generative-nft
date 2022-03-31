import fs from 'fs';
import { task } from 'hardhat/config';

const { wbnb: wbnbAddress } = require('./addresses');

task('deploy-ci', 'Deploy contracts (automated by CI)')
  // .addOptionalParam('noundersdao', 'The nounders DAO contract address')
  //.setAction(async ({ noundersdao, wbnb }, { ethers, run }) => {
  .setAction(async ({}, { ethers, run }) => {

    const network = await ethers.provider.getNetwork();
    const wbnb = wbnbAddress[network.chainId];
    const [deployer] = await ethers.getSigners();
    const contracts = await run('deploy', {
      wbnb,
    });

    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
    fs.writeFileSync(
      'logs/deploy.json',
      JSON.stringify({
        contractAddresses: {
          NFTDescriptor: contracts.NFTDescriptor.address,
          RadaDescriptor: contracts.RadaDescriptor.address,
          RadaSeeder: contracts.RadaSeeder.address,
          RadaToken: contracts.RadaToken.address,
          RadaAuctionHouse: contracts.RadaAuctionHouse.address,
        },
        gitHub: {
          // Get the commit sha when running in CI
          sha: process.env.GITHUB_SHA,
        },
      }),
      { flag: 'w' },
    );
  });
