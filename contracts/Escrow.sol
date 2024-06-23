// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id) external;
    function updateListedProperty(uint256 propertyId, address owner, bool isListed) external;
    function finalizeTransaction(uint256 propertyId, address oldOwner, address newOwner) external;
}

contract Escrow {
    address public seller;
    address public buyer;
    address public lender;

    address private realEstateAddress;
    uint256 public nftId;

    uint256 public price;
    uint256 public deposit;

    bool private atomicLock;

    enum EscrowState { Created, Locked, Paied, Canceled, Finalized }

    EscrowState public state;

    mapping(address => bool) public approvals;

//    TODO: Make sure only marketplace is allowed to call functions in this contract

    constructor(
        address _seller,
        address _buyer,
        uint256 _nftId,
        uint256 _price,
        uint256 _deposit,
        address _realEstateAddress
    ) {
        seller = _seller;
        buyer = _buyer;
        nftId = _nftId;
        price = _price;
        deposit = _deposit;
        realEstateAddress = _realEstateAddress;
        state = EscrowState.Created;
        approvals[_buyer] = false;
    }

    function addLender(address _lender) public  {
        lender = _lender;
        approvals[_lender] = false;
    }

    function pay() payable public {
        state = EscrowState.Paied;
    }

    function lock() public payable  {
        require(state == EscrowState.Created, 'Escrow is not in Created state');
        require(msg.value == deposit, 'Deposit amount is not correct');

        state = EscrowState.Locked;
    }

    function cancel() public {
        // TODO: Return money to buyer if cancel
        // require(msg.sender == seller || msg.sender == buyer, 'Only seller or buyer can call this method');
        require(state == EscrowState.Created || state == EscrowState.Finalized, 'Escrow is locked');

        IERC721(realEstateAddress).transferFrom(address(this), seller, nftId);
        state = EscrowState.Canceled;
    }

    function approve(address sender) public {
        require(state == EscrowState.Paied, 'Escrow is not paied state');
        approvals[sender] = true;
    }

    function finalize() public  {
        require(!atomicLock, 'Reentrancy attack blocked');
        atomicLock = true;
        require(state == EscrowState.Paied, 'Escrow is not in Locked state');
        require(approvals[buyer] == true, 'Buyer did not approve');
        require(lender == address(0) || approvals[lender] == true, 'Lender did not approve');
        require(address(this).balance >= price);

        bool success = payable(buyer).send(deposit);
        require(success, 'Transfer to buyer failed');
        success = payable(seller).send(address(this).balance);
        require(success, 'Transfer to seller failed');

        state = EscrowState.Finalized;
        atomicLock = false;

        IERC721(realEstateAddress).transferFrom(address(this), buyer, nftId);
    }
}