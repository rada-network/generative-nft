import { task, types } from 'hardhat/config';

task('mint-noun', 'Mints a Nft')
  .addOptionalParam(
    'radaToken',
    'The `RadaToken` contract address',
    '0x9E4C3917EaBCAA524F57715b388fa9fC9E36e906',
    types.string,
  )
  .setAction(async ({ radaToken }, { ethers }) => {
    const nftFactory = await ethers.getContractFactory('RadaToken');
    const nftContract = nftFactory.attach(radaToken);

    const receipt = await (await nftContract.mint()).wait();
    const nounCreated = receipt.events?.[1];
    const { tokenId } = nounCreated?.args;

    console.log(`NFT minted with ID: ${tokenId.toString()}.`);
  });
