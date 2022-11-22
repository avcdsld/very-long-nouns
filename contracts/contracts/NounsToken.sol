// SPDX-License-Identifier: GPL-3.0

/// @title The VeryLongNouns ERC-721 token

/*********************************
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 * ░░░░░░█████████░░█████████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░██████░░░████████░░░████░░░ *
 * ░░██░░██░░░████░░██░░░████░░░ *
 * ░░██░░██░░░████░░██░░░████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░░░░░█████████░░█████████░░░ *
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 *********************************/

pragma solidity ^0.8.6;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { ERC721Checkpointable } from './base/ERC721Checkpointable.sol';
import { INounsDescriptorMinimal } from './interfaces/INounsDescriptorMinimal.sol';
import { INounsSeeder } from './interfaces/INounsSeeder.sol';
import { INounsToken } from './interfaces/INounsToken.sol';
import { ERC721 } from './base/ERC721.sol';
import { IERC721 } from '@openzeppelin/contracts/token/ERC721/IERC721.sol';

contract NounsToken is INounsToken, Ownable, ERC721Checkpointable {
    // The Nouns token URI descriptor
    INounsDescriptorMinimal public descriptor;

    // Whether the descriptor can be updated
    bool public isDescriptorLocked;

    // The noun seeds
    mapping(uint256 => INounsSeeder.Seed) public seeds;

    // The internal noun ID tracker
    uint256 private _currentNounId;

    // IPFS content hash of contract-level metadata
    string private _contractURIHash = 'QmZi1n79FqWt2tTLwCqiy6nLM6xLGRsEPQ5JmReJQKNNzX';

    /**
     * @notice Require that the descriptor has not been locked.
     */
    modifier whenDescriptorNotLocked() {
        require(!isDescriptorLocked, 'Descriptor is locked');
        _;
    }

    constructor(INounsDescriptorMinimal _descriptor) ERC721('VeryLongNounsToken', 'VLNOUN') {
        descriptor = _descriptor;
    }

    /**
     * @notice The IPFS URI of contract-level metadata.
     */
    function contractURI() public view returns (string memory) {
        return string(abi.encodePacked('ipfs://', _contractURIHash));
    }

    /**
     * @notice Set the _contractURIHash.
     * @dev Only callable by the owner.
     */
    function setContractURIHash(string memory newContractURIHash) external onlyOwner {
        _contractURIHash = newContractURIHash;
    }

    /**
     * @notice Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-less listings.
     */
    function isApprovedForAll(address owner, address operator) public view override(IERC721, ERC721) returns (bool) {
        return super.isApprovedForAll(owner, operator);
    }

    /**
     * @notice Mint a noun.
     */
    function mint(
        uint48 background,
        uint48 body,
        uint48 accessory,
        uint48 head,
        uint48 glasses
    ) public override returns (uint256) {
        // TODO: validation
        INounsSeeder.Seed memory seed = INounsSeeder.Seed(
            background,
            body,
            accessory,
            head,
            glasses
        );
        return _mintTo(_msgSender(), _currentNounId++, seed);
    }

    /**
     * @notice Burn a noun.
     */
    function burn(uint256 nounId) public override {
        _burn(nounId);
        emit NounBurned(nounId);
    }

    /**
     * @notice A distinct Uniform Resource Identifier (URI) for a given asset.
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), 'NounsToken: URI query for nonexistent token');
        return descriptor.tokenURI(tokenId, seeds[tokenId]);
    }

    /**
     * @notice Similar to `tokenURI`, but always serves a base64 encoded data URI
     * with the JSON contents directly inlined.
     */
    function dataURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), 'NounsToken: URI query for nonexistent token');
        return descriptor.dataURI(tokenId, seeds[tokenId]);
    }

    /**
     * @notice Set the token URI descriptor.
     * @dev Only callable by the owner when not locked.
     */
    function setDescriptor(INounsDescriptorMinimal _descriptor) external override onlyOwner whenDescriptorNotLocked {
        descriptor = _descriptor;

        emit DescriptorUpdated(_descriptor);
    }

    /**
     * @notice Lock the descriptor.
     * @dev This cannot be reversed and is only callable by the owner when not locked.
     */
    function lockDescriptor() external override onlyOwner whenDescriptorNotLocked {
        isDescriptorLocked = true;

        emit DescriptorLocked();
    }

    /**
     * @notice Mint a Noun with `nounId` to the provided `to` address.
     */
    function _mintTo(address to, uint256 nounId, INounsSeeder.Seed memory seed) internal returns (uint256) {
        // TODO: duplication check
        seeds[nounId] = seed;

        _mint(owner(), to, nounId);
        emit NounCreated(nounId, seed);

        return nounId;
    }
}
