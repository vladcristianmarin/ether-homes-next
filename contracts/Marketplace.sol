// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "./Escrow.sol";


contract Marketplace {
    struct Listing {
        uint256 nftId;
        string nftURI;
        address seller;
        address escrow;
        uint256 price;
        bool isActive;
        address[] buyers;
        address buyer;
    }

    uint256 public count = 0;
    uint256[] public listed;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => bool) public activeListings;

    address private realEstateAddress;

    constructor(address _realEstateAddress) {
        realEstateAddress = _realEstateAddress;
    }

    event PropertyListed(uint256 nftId, string nftURI, address seller, uint256 price);
    event PropertySold(uint256 nftId, address buyer, address escrow);
    event EscrowCreated(uint256 nftId, address escrow);
    event ListingCanceled(uint256 nftId);

    modifier onlySeller(uint256 _nftId) {
        require(msg.sender == listings[_nftId].seller, 'Only seller can call this method');
        _;
    }

    modifier onlyBuyer(uint256 _nftId) {
        require(msg.sender == listings[_nftId].buyer, 'Only buyer can call this method MarketPlace');
        _;
    }

    modifier onlyLender(uint256 _nftId) {
        require(msg.sender == Escrow(listings[_nftId].escrow).lender() || msg.sender == Escrow(listings[_nftId].escrow).buyer(), 'Only lender can call this method');
        _;
    }

    function listProperty(uint256 _nftId, string memory _nftURI, uint256 _price) public {
        require(activeListings[_nftId] == false, 'Property already listed');
        listings[_nftId] = Listing(_nftId, _nftURI, msg.sender, address(0), _price, true, new address[](0), address(0));
        activeListings[_nftId] = true;
        listed.push(_nftId);
        emit PropertyListed(_nftId, _nftURI, msg.sender, _price);
        count++;
    }

    function cancelListing(uint256 _nftId) public onlySeller(_nftId) {
        require(activeListings[_nftId] == true, 'Property not listed');
        activeListings[_nftId] = false;

        listings[_nftId].isActive = false;

        if (listings[_nftId].buyer != address(0)) {
            Escrow escrow = Escrow(listings[_nftId].escrow);
            escrow.cancel();
        }

        emit ListingCanceled(_nftId);
    }

    function makeOffer(uint256 _nftId) public {
        require(activeListings[_nftId] == true, 'Property not listed');
        require(listings[_nftId].seller != msg.sender, 'Seller cannot buy his own property');
        require(listings[_nftId].buyer != msg.sender, 'Buyer already made an offer');

        listings[_nftId].buyers.push(msg.sender);
    }

    function acceptOffer(uint256 _nftId, address _buyer) public onlySeller(_nftId) {
        require(activeListings[_nftId] == true, 'Property not listed');
        require(listings[_nftId].seller != _buyer, 'Seller cannot buy his own property');
        require(listings[_nftId].buyer == address(0), 'Buyer already accepted');

        listings[_nftId].buyer = _buyer;
        Escrow escrow = new Escrow(msg.sender, _buyer, _nftId, listings[_nftId].price, 300000000000000, realEstateAddress);
        listings[_nftId].escrow = address(escrow);
        emit EscrowCreated(_nftId, listings[_nftId].escrow);
        IERC721(realEstateAddress).transferFrom(msg.sender, address(escrow), _nftId);
    }

    function rejectOffer(uint256 _nftId, address _buyer) public onlySeller(_nftId) {
        require(activeListings[_nftId] == true, 'Property not listed');
        require(listings[_nftId].seller != _buyer, 'Seller cannot buy his own property');
        require(listings[_nftId].buyer == address(0), 'Buyer already accepted');

        for (uint256 i = 0; i < listings[_nftId].buyers.length; i++) {
            if (listings[_nftId].buyers[i] == _buyer) {
                delete listings[_nftId].buyers[i];
                break;
            }
        }
    }

    function selectLender(uint256 _nftId, address _lender) public onlyBuyer(_nftId) {
        require(activeListings[_nftId] == true, 'Property not listed');
        require(listings[_nftId].seller != _lender, 'Seller cannot lend his own property');
        require(listings[_nftId].buyer != _lender, 'Buyer cannot lend his own property');

        Escrow escrow = Escrow(listings[_nftId].escrow);
        escrow.addLender(_lender);
    }

    function payDeposit(uint256 _nftId) public payable onlyBuyer(_nftId) {
        require(activeListings[_nftId] == true, 'Property not listed');

        Escrow escrow = Escrow(listings[_nftId].escrow);

        require(escrow.deposit() == msg.value, 'Deposit amount is not correct');

        escrow.lock{value: msg.value}();
    }

    function approve(uint256 _nftId) public {
        require(msg.sender == listings[_nftId].buyer || msg.sender == Escrow(listings[_nftId].escrow).lender(), 'Only buyer or lender can call this method');

        require(activeListings[_nftId] == true, 'Property not listed');

        Escrow escrow = Escrow(listings[_nftId].escrow);
        escrow.approve(msg.sender);
    }

    function cancel(uint256 _nftId) public {
        require(activeListings[_nftId] == true, 'Property not listed');

        Escrow escrow = Escrow(listings[_nftId].escrow);
        escrow.cancel();
    }

    function payTransaction(uint256 _nftId) public payable onlyLender(_nftId) {
        require(activeListings[_nftId] == true, 'Property not listed');

        Escrow escrow = Escrow(listings[_nftId].escrow);

        require(escrow.price() == msg.value, 'Transaction amount is not correct');
        escrow.pay{value: msg.value}();
    }

    function finalizeTransaction(uint256 _nftId) public onlySeller(_nftId) {
        require(activeListings[_nftId] == true, 'Property not listed');

        Escrow escrow = Escrow(listings[_nftId].escrow);
        escrow.finalize();
    }

    function getAllListed() public view returns (Listing[] memory) {
        Listing[] memory allListings = new Listing[](count);

        for (uint256 i = 0; i < count; i++) {
            allListings[i] = listings[listed[i]];
        }

        return allListings;
    }

    function getListedBySeller(address seller) public view returns (Listing[] memory) {
        uint256 bySellerCount;

        for(uint256 i = 0; i < count; i++) {
            if(listings[listed[i]].seller == seller) {
                bySellerCount++;
            }
        }

        Listing[] memory listingsBySeller = new Listing[](bySellerCount);

        for(uint256 i = 0; i < count; i++)  {
            if(listings[listed[i]].seller == seller) {
                listingsBySeller[i] = listings[listed[i]];
            }
        }

        return listingsBySeller;
    }
}