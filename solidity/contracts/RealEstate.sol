// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RealEstate is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => bool) private tokenMinted;
    mapping(uint256 => address) private tokenMinter;
    mapping(uint256 => address[]) private ownershipHistory;

    modifier _exists(uint256 id) {
        require(tokenMinted[id], "Token with this id was not minted");
        _;
    }

    modifier _onlyMinter(uint256 tokenId) {
        require(
            tokenMinter[tokenId] == msg.sender,
            "Only the minter can update the URI"
        );
        _;
    }

    constructor() ERC721("RealEstate", "REST") Ownable(msg.sender) {}

    function createTokenURI(string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        tokenMinted[tokenId] = true;
        tokenMinter[tokenId] = msg.sender;

        return tokenId;
    }

    function updateTokenURI(
        uint256 tokenID,
        string memory newTokenURI
    ) public _exists(tokenID) _onlyMinter(tokenID) {
        _setTokenURI(tokenID, newTokenURI);
    }

    function getOwnershipHistory(
        uint256 tokenID
    ) public view _exists(tokenID) returns (address[] memory) {
        return ownershipHistory[tokenID];
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) {
        super.transferFrom(from, to, tokenId);
        ownershipHistory[tokenId].push(from);
    }
}
