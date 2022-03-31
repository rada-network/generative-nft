// SPDX-License-Identifier: GPL-3.0


pragma solidity ^0.8.6;

import { IERC721 } from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import { INounsDescriptor } from './INounsDescriptor.sol';
import { INounsSeeder } from './INounsSeeder.sol';

interface INounsToken is IERC721 {
    // function setFounder(address _founder) external;
    event NftCreated(uint256 indexed tokenId, INounsSeeder.Seed seed);
    event NftBurned(uint256 indexed tokenId);
    event MinterUpdated(address minter, bool allow);
    event DescriptorUpdated(INounsDescriptor descriptor);
    event SeederUpdated(INounsSeeder seeder);

    function mint() external returns (uint256);
    function burn(uint256 tokenId) external;
    function setMinter(address minter, bool allow) external;
    function setDescriptor(INounsDescriptor descriptor) external;
    function setSeeder(INounsSeeder seeder) external;
    function dataURI(uint256 tokenId) external returns (string memory);
}
