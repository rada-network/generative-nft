import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { constants } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import {
  MaliciousBidder__factory as MaliciousBidderFactory,
  RadaAuctionHouse,
  RadaDescriptor__factory as RadaDescriptorFactory,
  RadaToken,
  Wbnb,
} from '../typechain';
import { deployRadaToken, deployWbnb, populateDescriptor } from './utils';

chai.use(solidity);
const { expect } = chai;

describe('RadaAuctionHouse', () => {
  let radaAuctionHouse: RadaAuctionHouse;
  let nounsToken: RadaToken;
  let bnb: Wbnb;
  let deployer: SignerWithAddress;
  let bidderA: SignerWithAddress;
  let bidderB: SignerWithAddress;
  let snapshotId: number;

  const TIME_BUFFER = 15 * 60;
  const RESERVE_PRICE = 2;
  const MIN_INCREMENT_BID_PERCENTAGE = 5;
  const DURATION = 60 * 60 * 24;

  async function deploy(deployer?: SignerWithAddress) {
    const auctionHouseFactory = await ethers.getContractFactory('RadaAuctionHouse', deployer);
    return upgrades.deployProxy(auctionHouseFactory, [
      nounsToken.address,
      bnb.address,
      TIME_BUFFER,
      RESERVE_PRICE,
      MIN_INCREMENT_BID_PERCENTAGE,
      DURATION,
    ]) as Promise<RadaAuctionHouse>;
  }

  before(async () => {
    [deployer,  bidderA, bidderB] = await ethers.getSigners();

    nounsToken = await deployRadaToken(deployer, deployer.address);
    bnb = await deployWbnb(deployer);
    radaAuctionHouse = await deploy(deployer);

    const descriptor = await nounsToken.descriptor();

    await populateDescriptor(RadaDescriptorFactory.connect(descriptor, deployer));

    await nounsToken.setMinter(radaAuctionHouse.address);
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send('evm_snapshot', []);
  });

  afterEach(async () => {
    await ethers.provider.send('evm_revert', [snapshotId]);
  });

  it('should revert if a second initialization is attempted', async () => {
    const tx = radaAuctionHouse.initialize(
      nounsToken.address,
      bnb.address,
      TIME_BUFFER,
      RESERVE_PRICE,
      MIN_INCREMENT_BID_PERCENTAGE,
      DURATION,
    );
    await expect(tx).to.be.revertedWith('Initializable: contract is already initialized');
  });

  it('should allow the radaDAO to unpause the contract and create the first auction', async () => {
    const tx = await radaAuctionHouse.unpause();
    await tx.wait();

    const auction = await radaAuctionHouse.auction();
    expect(auction.startTime.toNumber()).to.be.greaterThan(0);
  });

  it('should revert if a user creates a bid for an inactive auction', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    const { nounId } = await radaAuctionHouse.auction();
    const tx = radaAuctionHouse.connect(bidderA).createBid(nounId.add(1), {
      value: RESERVE_PRICE,
    });

    await expect(tx).to.be.revertedWith('NFT not up for auction');
  });

  it('should revert if a user creates a bid for an expired auction', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    await ethers.provider.send('evm_increaseTime', [60 * 60 * 25]); // Add 25 hours

    const { nounId } = await radaAuctionHouse.auction();
    const tx = radaAuctionHouse.connect(bidderA).createBid(nounId, {
      value: RESERVE_PRICE,
    });

    await expect(tx).to.be.revertedWith('Auction expired');
  });

  it('should revert if a user creates a bid with an amount below the reserve price', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    const { nounId } = await radaAuctionHouse.auction();
    const tx = radaAuctionHouse.connect(bidderA).createBid(nounId, {
      value: RESERVE_PRICE - 1,
    });

    await expect(tx).to.be.revertedWith('Must send at least reservePrice');
  });

  it('should revert if a user creates a bid less than the min bid increment percentage', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    const { nounId } = await radaAuctionHouse.auction();
    await radaAuctionHouse.connect(bidderA).createBid(nounId, {
      value: RESERVE_PRICE * 50,
    });
    const tx = radaAuctionHouse.connect(bidderB).createBid(nounId, {
      value: RESERVE_PRICE * 51,
    });

    await expect(tx).to.be.revertedWith(
      'Must send more than last bid by minBidIncrementPercentage amount',
    );
  });

  it('should refund the previous bidder when the following user creates a bid', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    const { nounId } = await radaAuctionHouse.auction();
    await radaAuctionHouse.connect(bidderA).createBid(nounId, {
      value: RESERVE_PRICE,
    });

    const bidderAPostBidBalance = await bidderA.getBalance();
    await radaAuctionHouse.connect(bidderB).createBid(nounId, {
      value: RESERVE_PRICE * 2,
    });
    const bidderAPostRefundBalance = await bidderA.getBalance();

    expect(bidderAPostRefundBalance).to.equal(bidderAPostBidBalance.add(RESERVE_PRICE));
  });

  it('should cap the maximum bid griefing cost at 30K gas + the cost to wrap and transfer WETH', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    const { nounId } = await radaAuctionHouse.auction();

    const maliciousBidderFactory = new MaliciousBidderFactory(bidderA);
    const maliciousBidder = await maliciousBidderFactory.deploy();

    const maliciousBid = await maliciousBidder
      .connect(bidderA)
      .bid(radaAuctionHouse.address, nounId, {
        value: RESERVE_PRICE,
      });
    await maliciousBid.wait();

    const tx = await radaAuctionHouse.connect(bidderB).createBid(nounId, {
      value: RESERVE_PRICE * 2,
      gasLimit: 1_000_000,
    });
    const result = await tx.wait();

    expect(result.gasUsed.toNumber()).to.be.lessThan(200_000);
    expect(await bnb.balanceOf(maliciousBidder.address)).to.equal(RESERVE_PRICE);
  });

  it('should emit an `AuctionBid` event on a successful bid', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    const { nounId } = await radaAuctionHouse.auction();
    const tx = radaAuctionHouse.connect(bidderA).createBid(nounId, {
      value: RESERVE_PRICE,
    });

    await expect(tx)
      .to.emit(radaAuctionHouse, 'AuctionBid')
      .withArgs(nounId, bidderA.address, RESERVE_PRICE, false);
  });

  it('should emit an `AuctionExtended` event if the auction end time is within the time buffer', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    const { nounId, endTime } = await radaAuctionHouse.auction();

    await ethers.provider.send('evm_setNextBlockTimestamp', [endTime.sub(60 * 5).toNumber()]); // Subtract 5 mins from current end time

    const tx = radaAuctionHouse.connect(bidderA).createBid(nounId, {
      value: RESERVE_PRICE,
    });

    await expect(tx)
      .to.emit(radaAuctionHouse, 'AuctionExtended')
      .withArgs(nounId, endTime.add(60 * 10));
  });

  it('should revert if auction settlement is attempted while the auction is still active', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    const { nounId } = await radaAuctionHouse.auction();

    await radaAuctionHouse.connect(bidderA).createBid(nounId, {
      value: RESERVE_PRICE,
    });
    const tx = radaAuctionHouse.connect(bidderA).settleCurrentAndCreateNewAuction();

    await expect(tx).to.be.revertedWith("Auction hasn't completed");
  });

  it('should emit `AuctionSettled` and `AuctionCreated` events if all conditions are met', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    const { nounId } = await radaAuctionHouse.auction();

    await radaAuctionHouse.connect(bidderA).createBid(nounId, {
      value: RESERVE_PRICE,
    });

    await ethers.provider.send('evm_increaseTime', [60 * 60 * 25]); // Add 25 hours
    const tx = await radaAuctionHouse.connect(bidderA).settleCurrentAndCreateNewAuction();

    const receipt = await tx.wait();
    const { timestamp } = await ethers.provider.getBlock(receipt.blockHash);

    const settledEvent = receipt.events?.find(e => e.event === 'AuctionSettled');
    const createdEvent = receipt.events?.find(e => e.event === 'AuctionCreated');

    expect(settledEvent?.args?.nounId).to.equal(nounId);
    expect(settledEvent?.args?.winner).to.equal(bidderA.address);
    expect(settledEvent?.args?.amount).to.equal(RESERVE_PRICE);

    expect(createdEvent?.args?.nounId).to.equal(nounId.add(1));
    expect(createdEvent?.args?.startTime).to.equal(timestamp);
    expect(createdEvent?.args?.endTime).to.equal(timestamp + DURATION);
  });

  it('should not create a new auction if the auction house is paused and unpaused while an auction is ongoing', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    await (await radaAuctionHouse.pause()).wait();

    await (await radaAuctionHouse.unpause()).wait();

    const { nounId } = await radaAuctionHouse.auction();

    expect(nounId).to.equal(1);
  });

  it('should create a new auction if the auction house is paused and unpaused after an auction is settled', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    const { nounId } = await radaAuctionHouse.auction();

    await radaAuctionHouse.connect(bidderA).createBid(nounId, {
      value: RESERVE_PRICE,
    });

    await ethers.provider.send('evm_increaseTime', [60 * 60 * 25]); // Add 25 hours

    await (await radaAuctionHouse.pause()).wait();

    const settleTx = radaAuctionHouse.connect(bidderA).settleAuction();

    await expect(settleTx)
      .to.emit(radaAuctionHouse, 'AuctionSettled')
      .withArgs(nounId, bidderA.address, RESERVE_PRICE);

    const unpauseTx = await radaAuctionHouse.unpause();
    const receipt = await unpauseTx.wait();
    const { timestamp } = await ethers.provider.getBlock(receipt.blockHash);

    const createdEvent = receipt.events?.find(e => e.event === 'AuctionCreated');

    expect(createdEvent?.args?.nounId).to.equal(nounId.add(1));
    expect(createdEvent?.args?.startTime).to.equal(timestamp);
    expect(createdEvent?.args?.endTime).to.equal(timestamp + DURATION);
  });

  it('should settle the current auction and pause the contract if the minter is updated while the auction house is unpaused', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    const { nounId } = await radaAuctionHouse.auction();

    await radaAuctionHouse.connect(bidderA).createBid(nounId, {
      value: RESERVE_PRICE,
    });

    await nounsToken.setMinter(constants.AddressZero);

    await ethers.provider.send('evm_increaseTime', [60 * 60 * 25]); // Add 25 hours

    const settleTx = radaAuctionHouse.connect(bidderA).settleCurrentAndCreateNewAuction();

    await expect(settleTx)
      .to.emit(radaAuctionHouse, 'AuctionSettled')
      .withArgs(nounId, bidderA.address, RESERVE_PRICE);

    const paused = await radaAuctionHouse.paused();

    expect(paused).to.equal(true);
  });

  it('should burn a Noun on auction settlement if no bids are received', async () => {
    await (await radaAuctionHouse.unpause()).wait();

    const { nounId } = await radaAuctionHouse.auction();

    await ethers.provider.send('evm_increaseTime', [60 * 60 * 25]); // Add 25 hours

    const tx = radaAuctionHouse.connect(bidderA).settleCurrentAndCreateNewAuction();

    await expect(tx)
      .to.emit(radaAuctionHouse, 'AuctionSettled')
      .withArgs(nounId, '0x0000000000000000000000000000000000000000', 0);
  });
});
