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
    address propertyInspector;
    bool verified;
    bool isTokenized;
    bool isListed;
    string ipfsFile;
    string[] documentsUris;
    string[] imagesUris;
  }

  struct PropertyReference {
    address creator;
    uint256 propertyId;
  }

  uint256 private _nextPropertyId = 0;
  uint256 private _nextTokenId = 0;

  mapping(uint256 => bool) private tokenMinted;
  mapping(uint256 => address[]) private ownershipHistory;

  address[] private propertyCreators;
  mapping(address => mapping(uint256 => Property)) private properties;
  mapping(address => uint256[]) private createdPropertiesIds;
  mapping(address => bool) private hasCreatedProperties;
  mapping(uint256 => uint256) private tokenIdToPropertyId;
  uint256 private propertiesCount = 0;

  address[] public inspectors;
  mapping(address => PropertyReference[]) private inspectorToProperties;

  modifier _onlyMinted(uint256 id) {
    require(tokenMinted[id], 'Token with this id was not minted');
    _;
  }

  modifier _onlyInspector(address inspector) {
    bool found = false;

    for (uint256 i = 0; i < inspectors.length; i++) {
      if (inspector == inspectors[i]) {
        found = true;
        break;
      }
    }

    require(found, 'Only an inspector can call this function');
    _;
  }

  modifier _onlyOwner(address owner, uint256 propertyId) {
    require(
      properties[owner][propertyId].owner !=
        0x0000000000000000000000000000000000000000,
      'Property not found'
    );
    _;
  }

  modifier _onlyVerified(address owner, uint256 propertyId) {
    require(properties[owner][propertyId].verified, 'Property not verified');
    _;
  }

  constructor(
    address[] memory _inspectors
  ) ERC721('RealEstate', 'REST') Ownable(msg.sender) {
    inspectors = _inspectors;
  }

  event PropertyCreated(Property property);

  function createProperty(
    string memory _city,
    string memory _propertyAddress,
    uint256 _rooms,
    uint256 _bathrooms,
    uint256 _usableArea,
    uint256 _totalArea,
    uint256 _yearOfConstruction,
    string[] memory _documentsUris,
    string[] memory _imagesUris
  ) public returns (uint256) {
    uint256 propertyId = _nextPropertyId++;
    uint256 pseudoRandomInspectorId = getRandomId(inspectors.length);

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
      block.timestamp,
      inspectors[pseudoRandomInspectorId],
      false,
      false,
      false,
      '',
      _documentsUris,
      _imagesUris
    );

    if (hasCreatedProperties[msg.sender] == false) {
      hasCreatedProperties[msg.sender] = true;
      propertyCreators.push(msg.sender);
    }

    properties[msg.sender][propertyId] = newProperty;
    inspectorToProperties[inspectors[pseudoRandomInspectorId]].push(
      PropertyReference(msg.sender, propertyId)
    );
    createdPropertiesIds[msg.sender].push(propertyId);
    propertiesCount++;

    emit PropertyCreated(newProperty);

    return propertyId;
  }

  function mintDummy(string memory tokenURI) public returns (uint256) {
    _mint(msg.sender, 0);
    _setTokenURI(0, tokenURI);

    return 0;
  }

  function createTokenURI(
    uint256 propertyId
  )
    public
    _onlyOwner(msg.sender, propertyId)
    _onlyVerified(msg.sender, propertyId)
    returns (uint256)
  {
    uint256 tokenId = _nextTokenId++;

    _mint(msg.sender, tokenId);
    _setTokenURI(tokenId, properties[msg.sender][propertyId].ipfsFile);

    tokenMinted[tokenId] = true;
    tokenIdToPropertyId[tokenId] = propertyId;
    properties[msg.sender][propertyId].isTokenized = true;

    return tokenId;
  }

  function updateTokenURI(
    uint256 tokenID,
    string memory newTokenURI
  ) public _onlyMinted(tokenID) {
    require(
      ownerOf(tokenID) == msg.sender,
      'Only the owner can update the token URI'
    );
    _setTokenURI(tokenID, newTokenURI);
  }

  function getOwnershipHistory(
    uint256 tokenID
  ) public view _onlyMinted(tokenID) returns (address[] memory) {
    return ownershipHistory[tokenID];
  }

  function getCreatedProperties() public view returns (Property[] memory) {
    uint256[] storage ids = createdPropertiesIds[msg.sender];
    Property[] memory ownedProperties = new Property[](ids.length);

    for (uint i = 0; i < ids.length; i++) {
      ownedProperties[i] = properties[msg.sender][ids[i]];
    }

    return ownedProperties;
  }

  function getCreatedPropertyById(
    uint256 id
  ) public view returns (Property memory) {
    Property memory property = properties[msg.sender][id];
    require(property.owner == msg.sender, 'This is not your property');
    return property;
  }

  function getOwnedTokens(
    address owner
  ) public view returns (uint256[] memory) {
    uint256 totalTokens = _nextTokenId;
    uint256[] memory ownedTokens = new uint256[](totalTokens);
    uint256 ownedTokenCount = 0;

    if (totalTokens == 0) {
      return ownedTokens;
    }

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

  function getPropertiesBatch(
    uint256 startIndex,
    uint256 _batchSize
  ) public view returns (Property[] memory) {
    uint256 batchSize;
    if (_batchSize == 0) {
      batchSize = propertiesCount;
    } else {
      batchSize = _batchSize;
    }

    if (startIndex >= propertiesCount) {
      Property[] memory emptyProperties;
      return emptyProperties;
    }

    uint endIndex = startIndex + batchSize > propertiesCount
      ? propertiesCount
      : startIndex + batchSize;
    Property[] memory propertiesBatch = new Property[](endIndex - startIndex);
    uint currentIndex = 0;

    for (
      uint i = 0;
      i < propertyCreators.length && currentIndex < batchSize;
      i++
    ) {
      address owner = propertyCreators[i];
      uint256[] memory ids = createdPropertiesIds[owner];
      for (
        uint j = 0;
        j < ids.length && startIndex + currentIndex < endIndex;
        j++
      ) {
        propertiesBatch[currentIndex] = properties[owner][ids[j]];
        currentIndex++;
      }
    }

    return propertiesBatch;
  }

  function getAssignedProperties()
    public
    view
    _onlyInspector(msg.sender)
    returns (Property[] memory)
  {
    Property[] memory assignedProperties = new Property[](
      inspectorToProperties[msg.sender].length
    );
    for (uint256 i = 0; i < inspectorToProperties[msg.sender].length; i++) {
      assignedProperties[i] = (
        properties[inspectorToProperties[msg.sender][i].creator][
          inspectorToProperties[msg.sender][i].propertyId
        ]
      );
    }
    return assignedProperties;
  }

  function getUninspectedProperties()
    public
    view
    _onlyInspector(msg.sender)
    returns (Property[] memory)
  {
    uint256 uninspectedCount = 0;

    for (uint256 i = 0; i < inspectorToProperties[msg.sender].length; i++) {
      Property memory property = properties[
        inspectorToProperties[msg.sender][i].creator
      ][inspectorToProperties[msg.sender][i].propertyId];
      if (property.verified == false) {
        uninspectedCount++;
      }
    }

    Property[] memory uninspectedProperties = new Property[](uninspectedCount);
    uint256 j = 0;
    for (uint256 i = 0; i < inspectorToProperties[msg.sender].length; i++) {
      Property memory property = properties[
        inspectorToProperties[msg.sender][i].creator
      ][inspectorToProperties[msg.sender][i].propertyId];
      if (property.verified == false) {
        uninspectedProperties[j] = property;
        j++;
      }
    }

    return uninspectedProperties;
  }

  function isInspector() public view returns (bool) {
    for (uint256 i = 0; i < inspectors.length; i++) {
      if (msg.sender == inspectors[i]) {
        return true;
      }
    }

    return false;
  }

  function updateListedProperty(uint256 propertyId, bool isListed) public _onlyOwner(msg.sender, propertyId) {
    Property memory property = properties[msg.sender][propertyId];

    require(
      property.owner != 0x0000000000000000000000000000000000000000,
      'Property was not found!'
    );

    properties[msg.sender][propertyId].isListed = isListed;
  }

  function assignIpfsFile(
    address propertyOwner,
    uint256 propertyId,
    string memory ipfsFile
  ) public _onlyInspector(msg.sender) {
    Property memory property = properties[propertyOwner][propertyId];

    require(
      property.owner != 0x0000000000000000000000000000000000000000,
      'Property was not found!'
    );

    require(bytes(property.ipfsFile).length == 0, 'IPFS file already exists');

    properties[propertyOwner][propertyId].ipfsFile = ipfsFile;
  }

  function verifyProperty(
    address propertyOwner,
    uint256 propertyId
  ) public _onlyInspector(msg.sender) {
    Property memory property = properties[propertyOwner][propertyId];

    require(
      property.owner != 0x0000000000000000000000000000000000000000,
      'Property was not found!'
    );

    require(
      bytes(property.ipfsFile).length != 0,
      'Please generate IPFS file before approval'
    );

    properties[propertyOwner][propertyId].verified = true;
  }

  function getRandomId(uint256 limit) private view returns (uint256) {
    require(limit > 0, 'Upper limit cannot be 0');

    uint256 pseudoRandom = uint256(
      keccak256(
        abi.encodePacked(
          tx.origin,
          blockhash(block.number - 1),
          block.timestamp
        )
      )
    );

    return pseudoRandom % limit;
  }

  function transferFrom(
    address from,
    address to,
    uint256 tokenId
  ) public override(ERC721, IERC721) {
    properties[from][tokenIdToPropertyId[tokenId]].owner = to;

    super.transferFrom(from, to, tokenId);
  }
}
