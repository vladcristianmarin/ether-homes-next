// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract RealEstate is ERC721URIStorage, Ownable {
  struct Property {
    uint256 id;
    address owner;
    string city;
    string propertAddress;
    uint256 rooms;
    uint256 bathrooms;
    uint256 usableArea;
    uint256 totalArea;
    uint256 yearOfConstruction;
    uint256 createdAt;
  }

  uint256 private _nextPropertyId;

  mapping(uint256 => bool) private tokenMinted;
  mapping(uint256 => address) private tokenMinter;
  mapping(uint256 => address[]) private ownershipHistory;
  mapping(address => Property[]) private properties;
  address[] private propertyOwners;

  modifier _exists(uint256 id) {
    require(tokenMinted[id], 'Token with this id was not minted');
    _;
  }

  modifier _onlyMinter(uint256 tokenId) {
    require(
      tokenMinter[tokenId] == msg.sender,
      'Only the minter can update the URI'
    );
    _;
  }

  constructor() ERC721('RealEstate', 'REST') Ownable(msg.sender) {}

  event PropertyCreated(uint256 propertyId);

  function createProperty(
    string memory _city,
    string memory _propertyAddress,
    uint256 _rooms,
    uint256 _bathrooms,
    uint256 _usableArea,
    uint256 _totalArea,
    uint256 _yearOfConstruction
  ) public returns (uint256) {
    uint256 propertyId = _nextPropertyId++;
    Property memory newProperty = Property(
      propertyId,
      msg.sender,
      _city,
      _propertyAddress,
      _rooms,
      _bathrooms,
      _usableArea,
      _totalArea,
      _yearOfConstruction,
      block.timestamp
    );

    if (properties[msg.sender].length == 0) {
      propertyOwners.push(msg.sender);
    }

    properties[msg.sender].push(newProperty);

    emit PropertyCreated(propertyId);

    return propertyId;
  }

  function createTokenURI(
    string memory tokenURI,
    uint256 propertyId
  ) public returns (uint256) {
    Property[] memory callersProperties = properties[msg.sender];

    bool propertyFound = false;
    for (uint256 i = 0; i < callersProperties.length; i++) {
      if (callersProperties[i].id == propertyId) {
        propertyFound = true;
        break;
      }
    }

    require(propertyFound, 'This property id is not created by the caller');

    _mint(msg.sender, propertyId);
    _setTokenURI(propertyId, tokenURI);

    tokenMinted[propertyId] = true;
    tokenMinter[propertyId] = msg.sender;

    return propertyId;
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

  function getOwnedProperties() public view returns (Property[] memory) {
    return properties[msg.sender];
  }

  function getOwnedPropertyById(
    uint256 id
  ) public view returns (Property memory) {
    Property memory property;

    for (uint256 i = 0; i < properties[msg.sender].length; i++) {
      if (properties[msg.sender][i].id == id) {
        property = properties[msg.sender][id];
        break;
      }
    }

    return property;
  }

  function getAllProperties() public view returns (Property[] memory) {
    uint256 totalProperties = _nextPropertyId;
    Property[] memory allProperties = new Property[](totalProperties);
    uint256 index = 0;

    for (uint256 i = 0; i < propertyOwners.length; i++) {
      Property[] memory addrProperties = properties[propertyOwners[i]];
      for (uint256 j = 0; j < addrProperties.length; j++) {
        allProperties[index] = addrProperties[j];
        index++;
      }
    }

    return allProperties;
  }

  function getOwnedTokens(
    address owner
  ) public view returns (uint256[] memory) {
    uint256 totalTokens = _nextPropertyId;
    uint256[] memory ownedTokens = new uint256[](totalTokens);
    uint256 ownedTokenCount = 0;

    for (uint256 i = 0; i < totalTokens; i++) {
      if (ownerOf(i) == owner) {
        ownedTokens[ownedTokenCount] = i;
        ownedTokenCount++;
      }
    }

    uint256[] memory trimmedTokens = new uint256[](ownedTokenCount);
    for (uint256 j = 0; j < ownedTokenCount; j++) {
      trimmedTokens[j] = ownedTokens[j];
    }

    return trimmedTokens;
  }

  function transferFrom(
    address from,
    address to,
    uint256 tokenId
  ) public override(ERC721, IERC721) {
    super.transferFrom(from, to, tokenId);

    uint256 indexToRemove = 0;
    for (uint256 i = 0; i < properties[from].length; i++) {
      if (properties[from][i].id == tokenId) {
        indexToRemove = i;
        break;
      }
    }
    properties[from][indexToRemove].owner = to;

    properties[to].push(properties[from][indexToRemove]);
    delete properties[from][indexToRemove];

    ownershipHistory[tokenId].push(from);
  }
}
