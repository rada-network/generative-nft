// SPDX-License-Identifier: MIT
/***********************************************
'...########:::::'###::::'########:::::'###::::
....##.... ##:::'## ##::: ##.... ##:::'## ##:::
....##:::: ##::'##:. ##:: ##:::: ##::'##:. ##::
....########::'##:::. ##: ##:::: ##:'##:::. ##:
....##.. ##::: #########: ##:::: ##: #########:
....##::. ##:: ##.... ##: ##:::: ##: ##.... ##:
....##:::. ##: ##:::: ##: ########:: ##:::: ##:
...:::::..::..:::::..::........:::..:::::..::
Fork from NousDAO
***********************************************/
pragma solidity ^0.8.6;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
// import { ERC721Checkpointable } from './base/ERC721Checkpointable.sol';
// import { ERC721 } from './base/ERC721.sol';
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import { INounsDescriptor } from "./interfaces/INounsDescriptor.sol";
import { INounsSeeder } from  "./interfaces/INounsSeeder.sol";
import { INounsToken } from "./interfaces/INounsToken.sol";

contract RadaToken is INounsToken, Ownable, ERC721 {

    INounsDescriptor public descriptor;
    address public minter;
    uint256 private _currentNftId;

    INounsSeeder public seeder;

    mapping(uint256 => INounsSeeder.Seed) public seeds;

    constructor(
        address _minter,
        INounsDescriptor _descriptor,
        INounsSeeder _seeder
    ) ERC721("wolfNFT", "WOLF")
    {
        minter = _minter;
        descriptor = _descriptor;
        seeder = _seeder;
    }

    /**
     * @notice Require that the sender is the minter.
     */
    modifier onlyMinter() {
        require(msg.sender == minter, 'Sender is not the minter');
        _;
    }

    /* Minting */
    function mint() external override onlyMinter returns (uint256) {
        /* if (_currentNftId <= 1820 && _currentNftId % 10 == 0) {
            _mintTo(founder, _currentNftId++);
        } */
        return _mintTo(minter, _currentNftId++);
    }
    function _mintTo(address to, uint256 nftId) internal returns (uint256) {
        INounsSeeder.Seed memory seed = seeds[nftId] = seeder.generateSeed(nftId, descriptor);
        _mint(to, nftId);
        emit NftCreated(nftId, seed);

        return nftId;
    }
    /**
     * @notice Burn a noun.
     */
    function burn(uint256 nftId) public override onlyMinter {
        _burn(nftId);
        emit NftBurned(nftId);
    }
    function dataURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), 'NounsToken: URI query for nonexistent token');
        return descriptor.dataURI(tokenId, seeds[tokenId]);
    }
        /**
     * @notice Set the token minter.
     * @dev Only callable by the owner when not locked.
     */
    function setMinter(address _minter) external override onlyOwner {
        minter = _minter;

        emit MinterUpdated(_minter);
    }
        /**
     * @notice Set the token URI descriptor.
     * @dev Only callable by the owner when not locked.
     */
    function setDescriptor(INounsDescriptor _descriptor) external override onlyOwner  {
        descriptor = _descriptor;

        emit DescriptorUpdated(_descriptor);
    }
    /**
     * @notice Set the token seeder.
     * @dev Only callable by the owner when not locked.
     */
    function setSeeder(INounsSeeder _seeder) external override onlyOwner  {
        seeder = _seeder;

        emit SeederUpdated(_seeder);
    }

}