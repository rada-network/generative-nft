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
import "@openzeppelin/contracts/access/Ownable.sol";
import "base64-sol/base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import { INounsDescriptor } from './interfaces/INounsDescriptor.sol';
import { INounsSeeder } from  "./interfaces/INounsSeeder.sol";

import { NFTDescriptor } from './libs/NFTDescriptor.sol';
import { MultiPartRLEToSVG } from './libs/MultiPartRLEToSVG.sol';
import { IERC721 } from '@openzeppelin/contracts/token/ERC721/IERC721.sol';

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RadaDescriptor is INounsDescriptor, Ownable {
    using Strings for uint256;
    // Noun Color Palettes (Index => Hex Colors)
    mapping(uint8 => string[]) public override palettes;

    // Noun Backgrounds (Hex Colors)
    string[] public override backgrounds;

    // Noun Bodies (Custom RLE)
    bytes[] public override bodies;

    // Noun Accessories (Custom RLE)
    bytes[] public override accessories;

    // Noun Heads (Custom RLE)
    bytes[] public override heads;

    // Noun Glasses (Custom RLE)
    bytes[] public override glasses;

    /**
     * @notice Require that the parts have not been locked.
     */

    /**
     * @notice Get the number of available Noun `backgrounds`.
     */
    function backgroundCount() external view override returns (uint256) {
        return backgrounds.length;
    }

    /**
     * @notice Get the number of available Noun `bodies`.
     */
    function bodyCount() external view override returns (uint256) {
        return bodies.length;
    }

    /**
     * @notice Get the number of available Noun `accessories`.
     */
    function accessoryCount() external view override returns (uint256) {
        return accessories.length;
    }

    /**
     * @notice Get the number of available Noun `heads`.
     */
    function headCount() external view override returns (uint256) {
        return heads.length;
    }

    /**
     * @notice Get the number of available Noun `glasses`.
     */
    function glassesCount() external view override returns (uint256) {
        return glasses.length;
    }

    /**
     * @notice Add colors to a color palette.
     * @dev This function can only be called by the owner.
     */
    function addManyColorsToPalette(
        uint8 paletteIndex,
        string[] calldata newColors
    ) external override onlyOwner {
        require(
            palettes[paletteIndex].length + newColors.length <= 256,
            "Palettes can only hold 256 colors"
        );
        for (uint256 i = 0; i < newColors.length; i++) {
            _addColorToPalette(paletteIndex, newColors[i]);
        }
    }

    /**
     * @notice Batch add Noun backgrounds.
     * @dev This function can only be called by the owner when not locked.
     */
    function addManyBackgrounds(string[] calldata _backgrounds)
        external override
        onlyOwner
    {
        for (uint256 i = 0; i < _backgrounds.length; i++) {
            _addBackground(_backgrounds[i]);
        }
    }

    /**
     * @notice Batch add Noun bodies.
     * @dev This function can only be called by the owner when not locked.
     */
    function addManyBodies(bytes[] calldata _bodies)
        external override
        onlyOwner
    {
        for (uint256 i = 0; i < _bodies.length; i++) {
            _addBody(_bodies[i]);
        }
    }

    /**
     * @notice Batch add Noun accessories.
     * @dev This function can only be called by the owner when not locked.
     */
    function addManyAccessories(bytes[] calldata _accessories)
        external override
        onlyOwner
    {
        for (uint256 i = 0; i < _accessories.length; i++) {
            _addAccessory(_accessories[i]);
        }
    }

    /**
     * @notice Batch add Noun heads.
     * @dev This function can only be called by the owner when not locked.
     */
    function addManyHeads(bytes[] calldata _heads) external override onlyOwner {
        for (uint256 i = 0; i < _heads.length; i++) {
            _addHead(_heads[i]);
        }
    }

    /**
     * @notice Batch add Noun glasses.
     * @dev This function can only be called by the owner when not locked.
     */
    function addManyGlasses(bytes[] calldata _glasses)
        external override
        onlyOwner
    {
        for (uint256 i = 0; i < _glasses.length; i++) {
            _addGlasses(_glasses[i]);
        }
    }

    /**
     * @notice Add a single color to a color palette.
     * @dev This function can only be called by the owner.
     */
    function addColorToPalette(uint8 _paletteIndex, string calldata _color)
        external override
        onlyOwner
    {
        require(
            palettes[_paletteIndex].length <= 255,
            "Palettes can only hold 256 colors"
        );
        _addColorToPalette(_paletteIndex, _color);
    }

    /**
     * @notice Add a Noun background.
     * @dev This function can only be called by the owner when not locked.
     */
    function addBackground(string calldata _background)
        external override
        onlyOwner
    {
        _addBackground(_background);
    }

    /**
     * @notice Add a Noun body.
     * @dev This function can only be called by the owner when not locked.
     */
    function addBody(bytes calldata _body) external override onlyOwner {
        _addBody(_body);
    }

    /**
     * @notice Add a Noun accessory.
     * @dev This function can only be called by the owner when not locked.
     */
    function addAccessory(bytes calldata _accessory)
        external override
        onlyOwner
    {
        _addAccessory(_accessory);
    }

    /**
     * @notice Add a Noun head.
     * @dev This function can only be called by the owner when not locked.
     */
    function addHead(bytes calldata _head) external override onlyOwner {
        _addHead(_head);
    }

    /**
     * @notice Add Noun glasses.
     * @dev This function can only be called by the owner when not locked.
     */
    function addGlasses(bytes calldata _glasses) external override onlyOwner {
        _addGlasses(_glasses);
    }

    function _addColorToPalette(uint8 _paletteIndex, string calldata _color)
        internal
    {
        palettes[_paletteIndex].push(_color);
    }

    /**
     * @notice Add a Noun background.
     */
    function _addBackground(string calldata _background) internal {
        backgrounds.push(_background);
    }

    /**
     * @notice Add a Noun body.
     */
    function _addBody(bytes calldata _body) internal {
        bodies.push(_body);
    }

    /**
     * @notice Add a Noun accessory.
     */
    function _addAccessory(bytes calldata _accessory) internal {
        accessories.push(_accessory);
    }

    /**
     * @notice Add a Noun head.
     */
    function _addHead(bytes calldata _head) internal {
        heads.push(_head);
    }

    /**
     * @notice Add Noun glasses.
     */
    function _addGlasses(bytes calldata _glasses) internal {
        glasses.push(_glasses);
    }

    /* function buildMetaData(uint256 _tokenId, INounsSeeder.Seed memory seed, string memory name, string memory description)
        public
        view
        returns (string memory)
    {
        MultiPartRLEToSVG.SVGParams memory params = MultiPartRLEToSVG.SVGParams({
            parts: _getPartsForSeed(seed),
            background: backgrounds[seed.background]
        });
        string memory imageURI = generateSVGImage(params);
        return string(
            abi.encodePacked(
                'data:application/json;base64,',
                Base64.encode(
                    bytes(
                        abi.encodePacked('{"name":"', name, '", "description":"', description, '", "image": "', 'data:image/svg+xml;base64,', imageURI, '"}')
                    )
                )
            )
        );
    } */

    /**
     * @notice Given a token ID and seed, construct a token URI for an official NFT.
     * @dev The returned value may be a base64 encoded data URI or an API URL.
     */
    function tokenURI(uint256 _tokenId, INounsSeeder.Seed memory seed)
        public
        view
        override
        returns (string memory)
    {
        return dataURI(_tokenId, seed);
    }
/**
     * @notice Given a token ID and seed, construct a base64 encoded data URI for an official NFT.
     */
    /* function dataURI(uint256 _tokenId, INounsSeeder.Seed memory seed) public view returns (string memory) {
        string memory tokenId_ = Strings.toString(_tokenId);
        string memory name = string(abi.encodePacked('Rada NFT ', tokenId_));
        string memory description = string(abi.encodePacked('Noun ', tokenId_, ' One of NFT Gallery Of RADA DAO'));
        return buildMetaData(_tokenId, seed , name, description);
    } */
    /**
     * @notice Given a token ID and seed, construct a base64 encoded data URI for an official Nouns DAO noun.
     */
    function dataURI(uint256 tokenId, INounsSeeder.Seed memory seed) public view override returns (string memory) {
        string memory nounId = tokenId.toString();
        string memory name = string(abi.encodePacked('NFT ', nounId));
        string memory description = string(abi.encodePacked('NFT ', nounId, ' is a member of the NFT RADA'));

        return genericDataURI(name, description, seed);
    }

    /**
     * @notice Given a seed, construct a base64 encoded SVG image.
     */
    function generateSVGImage(INounsSeeder.Seed memory seed) external view override returns (string memory) {
        MultiPartRLEToSVG.SVGParams memory params = MultiPartRLEToSVG.SVGParams({
            parts: _getPartsForSeed(seed),
            background: backgrounds[seed.background]
        });
        return NFTDescriptor.generateSVGImage(params, palettes);
    }

    /* function generateSVGImage(MultiPartRLEToSVG.SVGParams memory params)
        public
        view
        returns (string memory svg)
    {
        return Base64.encode(bytes(MultiPartRLEToSVG.generateSVG(params, palettes)));
    } */

    function _getPartsForSeed(INounsSeeder.Seed memory seed) internal view returns (bytes[] memory) {
        bytes[] memory _parts = new bytes[](4);
        _parts[0] = bodies[seed.body];
        _parts[1] = accessories[seed.accessory];
        _parts[2] = heads[seed.head];
        _parts[3] = glasses[seed.glasses];
        return _parts;
    }

        /**
     * @notice Given a name, description, and seed, construct a base64 encoded data URI.
     */
    function genericDataURI(
        string memory name,
        string memory description,
        INounsSeeder.Seed memory seed
    ) public view override returns (string memory) {
        NFTDescriptor.TokenURIParams memory params = NFTDescriptor.TokenURIParams({
            name: name,
            description: description,
            parts: _getPartsForSeed(seed),
            background: backgrounds[seed.background]
        });
        return NFTDescriptor.constructTokenURI(params, palettes);
    }
}
