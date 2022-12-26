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

pragma solidity ^0.8.17;

import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { ERC721Checkpointable } from './base/ERC721Checkpointable.sol';
import { INounsDescriptorMinimal } from './interfaces/INounsDescriptorMinimal.sol';
import { INounsSeeder } from './interfaces/INounsSeeder.sol';
import { INounsToken } from './interfaces/INounsToken.sol';
import { ERC721 } from './base/ERC721.sol';
import { IERC721 } from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IOriginalNounsToken {
    function ownerOf(uint256) external view returns (address);
    function seeds(uint256) external view returns (INounsSeeder.Seed memory);
}

contract NounsToken is INounsToken, Ownable, ERC721Checkpointable {
    struct SeedExistingAndGeneration {
        bool exist;
        uint128 generation;
    }

    using ECDSA for bytes32;

    // The original NounsToken
    IOriginalNounsToken public originalNounsToken;

    // The Nouns token URI descriptor
    INounsDescriptorMinimal public descriptor;

    // Whether the descriptor can be updated
    bool public isDescriptorLocked;

    // Public minting status
    bool public isPublicMintPaused = true;

    // The noun seeds
    mapping(uint256 => INounsSeeder.Seed) public seeds;

    // Minted noun seeds (The key is the value of seed serialized to uint256).
    // Generation should be one less than the actual value.
    mapping(uint256 => SeedExistingAndGeneration) public existingSeedWithGenerations;

    // Mint price
    uint256 public priceForNounOwner = 0.005 ether;
    uint256 public price = 0.005 ether;

    // The current generation number
    uint128 private currentGeneration;

    // The Noun ID limit for the current generation
    uint256 private currentGenerationNounIdLimit = 10_001_000;

    // The internal noun ID tracker
    uint256 private _currentNounId = 10_000_000;

    // IPFS content hash of contract-level metadata
    string private _contractURIHash = 'QmZi1n79FqWt2tTLwCqiy6nLM6xLGRsEPQ5JmReJQKNNzX'; // TODO:

    // The signer address for pre minting
    address public preMintSigner;

    /**
     * @notice Require that the descriptor has not been locked.
     */
    modifier whenDescriptorNotLocked() {
        require(!isDescriptorLocked, 'Descriptor is locked');
        _;
    }

    /**
     * @notice Require that public minting has not been paused.
     */
    modifier whenPublicMintNotPaused() {
        require(!isPublicMintPaused, 'Public minting is paused');
        _;
    }

    constructor(
        INounsDescriptorMinimal _descriptor,
        IOriginalNounsToken _originalNounsToken
    ) ERC721('VeryLongNounsToken', 'VLNOUN') {
        descriptor = _descriptor;
        originalNounsToken = _originalNounsToken;
    }

    /**
     * @notice The IPFS URI of contract-level metadata.
     */
    function contractURI() public view returns (string memory) {
        return string.concat('ipfs://', _contractURIHash);
    }

    /**
     * @notice Set the _contractURIHash.
     * @dev Only callable by the owner.
     */
    function setContractURIHash(string memory newContractURIHash) external onlyOwner {
        _contractURIHash = newContractURIHash;
    }

    /**
     * @notice Set the priceForNounOwner.
     * @dev Only callable by the owner.
     */
    function setPriceForNounOwner(uint256 _priceForNounOwner) external onlyOwner {
        priceForNounOwner = _priceForNounOwner;
    }

    /**
     * @notice Set the price.
     * @dev Only callable by the owner.
     */
    function setPrice(uint256 _price) external onlyOwner {
        price = _price;
    }

    /**
     * @notice Increment the generation.
     * @dev Only callable by the owner.
     */
    function incrementGeneration(uint256 nextNounIdLimit) external onlyOwner {
        require(nextNounIdLimit > _currentNounId, "Invalid limit");
        currentGenerationNounIdLimit = nextNounIdLimit;
        currentGeneration++;
    }

    function getGeneration(uint256 tokenId) public view returns (uint128) {
        INounsSeeder.Seed memory seed = seeds[tokenId];
        uint256 seedKey = (uint256(seed.background) << 32) + (uint256(seed.body) << 24) + (uint256(seed.accessory) << 16) + (uint256(seed.head) << 8) + (uint256(seed.glasses));
        return existingSeedWithGenerations[seedKey].generation;
    }

    /**
     * @notice Set the signer address for pre minting.
     * @dev Only callable by the owner.
     */
    function setPreMintSigner(address signer) external onlyOwner {
        preMintSigner = signer;
    }

    /**
     * @notice Withdraw the sales.
     * @dev Only callable by the owner.
     */
    function withdraw(address payable to) external onlyOwner {
        uint256 balance = address(this).balance;
        to.transfer(balance);
    }

    /**
     * @notice Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-less listings.
     */
    function isApprovedForAll(address owner, address operator) public view override(IERC721, ERC721) returns (bool) {
        return super.isApprovedForAll(owner, operator);
    }

    function isMintedSeed(
        uint48 background,
        uint48 body,
        uint48 accessory,
        uint48 head,
        uint48 glasses
    ) public view returns (bool) {
        uint256 seedKey = (uint256(background) << 32) + (uint256(body) << 24) + (uint256(accessory) << 16) + (uint256(head) << 8) + (uint256(glasses));
        return existingSeedWithGenerations[seedKey].exist;
    }

    /**
     * @notice Mint a noun for original Noun owners.
     */
    function mintForNounOwner(uint256 tokenId) public payable returns (uint256) {
        require(priceForNounOwner <= msg.value, "Ether value sent is not correct");
        require(_msgSender() == originalNounsToken.ownerOf(tokenId), "Invalid owner");

        INounsSeeder.Seed memory seed = originalNounsToken.seeds(tokenId);
        uint256 seedKey = (uint256(seed.background) << 32) + (uint256(seed.body) << 24) + (uint256(seed.accessory) << 16) + (uint256(seed.head) << 8) + (uint256(seed.glasses));
        // require(!existingSeedWithGenerations[seedKey].exist, "That seed has already been used");
        existingSeedWithGenerations[seedKey] = SeedExistingAndGeneration(true, 0); // Always Gen 0

        return _mintTo(_msgSender(), tokenId, seed);
    }

    /**
     * @notice Pre Mint a noun.
     */
    function preMint(
        uint48 background,
        uint48 body,
        uint48 accessory,
        uint48 head,
        uint48 glasses,
        address to,
        uint256 expiredAt,
        bytes memory signature
    ) public payable override returns (uint256) {
        require(price <= msg.value, "Ether value sent is not correct");
        require(_currentNounId < currentGenerationNounIdLimit, "Can't mint any more");
        require(background >= 2, "Invalid background");
        uint256 seedKey = (uint256(background) << 32) + (uint256(body) << 24) + (uint256(accessory) << 16) + (uint256(head) << 8) + (uint256(glasses));
        require(!existingSeedWithGenerations[seedKey].exist, "That seed has already been used");
        existingSeedWithGenerations[seedKey] = SeedExistingAndGeneration(true, currentGeneration);

        require(expiredAt > block.timestamp, "Expired signature");
        bytes32 hash = keccak256(abi.encodePacked(to, expiredAt));
        require(hash.toEthSignedMessageHash().recover(signature) == preMintSigner, "Invalid signature");

        INounsSeeder.Seed memory seed = INounsSeeder.Seed(
            background,
            body,
            accessory,
            head,
            glasses
        );
        return _mintTo(to, _currentNounId++, seed);
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
    ) public payable override whenPublicMintNotPaused returns (uint256) {
        require(price <= msg.value, "Ether value sent is not correct");
        require(_currentNounId < currentGenerationNounIdLimit, "Can't mint any more");
        require(background >= 2, "Invalid background");
        uint256 seedKey = (uint256(background) << 32) + (uint256(body) << 24) + (uint256(accessory) << 16) + (uint256(head) << 8) + (uint256(glasses));
        require(!existingSeedWithGenerations[seedKey].exist, "That seed has already been used");
        existingSeedWithGenerations[seedKey] = SeedExistingAndGeneration(true, currentGeneration);

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
        return descriptor.tokenURI(tokenId, seeds[tokenId], getGeneration(tokenId));
    }

    /**
     * @notice Similar to `tokenURI`, but always serves a base64 encoded data URI
     * with the JSON contents directly inlined.
     */
    function dataURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), 'NounsToken: URI query for nonexistent token');
        return descriptor.dataURI(tokenId, seeds[tokenId], getGeneration(tokenId));
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
     * @notice Set isPublicMintPaused.
     */
    function setPublicMintPaused(bool paused) external onlyOwner {
        isPublicMintPaused = paused;
    }

    /**
     * @notice Returns whether `tokenId` exists.
     */
    function exists(uint256 tokenId) external override view returns (bool) {
        return _exists(tokenId);
    }

    /**
     * @notice Mint a Noun with `nounId` to the provided `to` address.
     */
    function _mintTo(address to, uint256 nounId, INounsSeeder.Seed memory seed) internal returns (uint256) {
        seeds[nounId] = seed;
        _mint(owner(), to, nounId);
        emit NounCreated(nounId, seed);
        return nounId;
    }
}
