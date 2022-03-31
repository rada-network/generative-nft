import chai from 'chai';
import { describe,before,it } from 'mocha';

import { ethers } from 'hardhat';
import { BigNumber as EthersBN, constants } from 'ethers';
import { solidity } from 'ethereum-waffle';
import { RadaDescriptor__factory as RadaDescriptorFactory, RadaToken } from '../typechain';
import { deployRadaToken, populateDescriptor } from './utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(solidity);
const { expect } = chai;

describe('RadaToken', () => {
  let nftToken: RadaToken;
  let deployer: SignerWithAddress;
  let otherUser: SignerWithAddress;
  let snapshotId: number;

  before(async () => {
    [deployer, otherUser] = await ethers.getSigners();
    nftToken = await deployRadaToken(deployer, deployer.address);

    const descriptor = await nftToken.descriptor();

    await populateDescriptor(RadaDescriptorFactory.connect(descriptor, deployer));
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send('evm_snapshot', []);
  });

  afterEach(async () => {
    await ethers.provider.send('evm_revert', [snapshotId]);
  });

  it('should allow the minter to mint a NFT to itself', async () => {

    let receipt = await (await nftToken.mint()).wait();

    let [, nounCreated] = receipt.events || [];

    expect(await nftToken.ownerOf(1)).to.eq(deployer.address);
    expect(nounCreated?.event).to.eq('NftCreated');
    expect(nounCreated?.args?.tokenId).to.eq(1);
    expect(nounCreated?.args?.seed.length).to.equal(5);

    nounCreated?.args?.seed.forEach((item: EthersBN | number) => {
      const value = typeof item !== 'number' ? item?.toNumber() : item;
      expect(value).to.be.a('number');
    });

  });

  it('should allow the minter to mint a NFT and transfer to other user', async () => {

    await (await nftToken.mint()).wait();

    await nftToken.connect(deployer)['safeTransferFrom(address,address,uint256)'](deployer.address,otherUser.address,1);
    //.safeTransferFrom(deployer.address,otherUser.address,0);

    expect(await nftToken.ownerOf(1)).to.eq(otherUser.address);

  });

  it('should set symbol', async () => {
    expect(await nftToken.symbol()).to.eq('WOLF');
  });

  it('should set name', async () => {
    expect(await nftToken.name()).to.eq('wolfNFT');
  });

  it('should allow minter to burn a noun', async () => {
    await (await nftToken.mint()).wait();

    const tx = nftToken.burn(1);
    await expect(tx).to.emit(nftToken, 'NftBurned').withArgs(1);
  });

  it('should revert on non-minter mint', async () => {
    const account0AsNounErc721Account = nftToken.connect(otherUser);
    await expect(account0AsNounErc721Account.mint()).to.be.reverted;
  });
});
