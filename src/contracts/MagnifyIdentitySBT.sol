// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@thirdweb-dev/contracts/base/ERC721Base.sol";
import "@thirdweb-dev/contracts/extension/PermissionsEnumerable.sol";

contract MagnifyIdentitySBT is ERC721Base, PermissionsEnumerable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Mapping from address to verification provider
    mapping(address => string) private _verificationProviders;
    
    // Mapping to track if an address has a token
    mapping(address => bool) private _hasToken;

    constructor(
        string memory _name,
        string memory _symbol,
        address _royaltyRecipient,
        uint128 _royaltyBps
    ) ERC721Base(_name, _symbol, _royaltyRecipient, _royaltyBps) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }

    function mintSoulboundToken(
        address _to,
        string memory _provider
    ) external onlyRole(MINTER_ROLE) {
        require(!_hasToken[_to], "Address already has an identity token");
        
        uint256 tokenId = totalSupply();
        _safeMint(_to, 1);
        _verificationProviders[_to] = _provider;
        _hasToken[_to] = true;
        
        emit TokensMinted(_to, tokenId, 1);
    }

    function getVerificationProvider(address _holder) external view returns (string memory) {
        require(_hasToken[_holder], "Address has no identity token");
        return _verificationProviders[_holder];
    }

    function hasIdentityToken(address _account) external view returns (bool) {
        return _hasToken[_account];
    }

    // Override transfer functions to make tokens soulbound
    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal virtual override {
        require(from == address(0) || to == address(0), "Token is soulbound");
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
    }
}