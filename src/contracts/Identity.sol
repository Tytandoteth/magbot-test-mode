// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MagnifyIdentity is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;
    mapping(address => bool) private _hasToken;
    mapping(uint256 => string) private _verificationProviders;

    event IdentityMinted(address indexed to, uint256 tokenId, string provider);

    constructor() ERC721("MagnifyIdentity", "MGID") Ownable(msg.sender) {}

    function mintSoulboundToken(address to, string memory provider) external onlyOwner returns (uint256) {
        require(!_hasToken[to], "Address already has an identity token");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _verificationProviders[tokenId] = provider;
        _hasToken[to] = true;
        
        emit IdentityMinted(to, tokenId, provider);
        
        return tokenId;
    }

    function getVerificationProvider(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _verificationProviders[tokenId];
    }

    function hasIdentityToken(address account) external view returns (bool) {
        return _hasToken[account];
    }

    // Override transfer functions to make tokens soulbound
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        require(from == address(0) || to == address(0), "Token is soulbound");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}