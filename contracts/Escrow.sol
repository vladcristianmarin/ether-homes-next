// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id) external;
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

    enum EscrowState { Created, Locked, Canceled, Finalized }

    EscrowState public state;

    mapping(address => bool) private approvals;

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
    }

    function addLender(address _lender) public  {
        lender = _lender;
    }

    function lock() public payable  {
        require(state == EscrowState.Created, 'Escrow is not in Created state');
        require(msg.value == deposit, 'Deposit amount is not correct');

        state = EscrowState.Locked;
    }

    function cancel() public {
        require(msg.sender == seller || msg.sender == buyer, 'Only seller or buyer can call this method');
        require(state == EscrowState.Created, 'Escrow is not in Created state');

        IERC721(realEstateAddress).transferFrom(address(this), seller, nftId);
        state = EscrowState.Canceled;
    }

    function approve() public {
        require(msg.sender == buyer || msg.sender == lender, 'Only buyer or lender can call this method');
        require(state == EscrowState.Locked, 'Escrow is not in Locked state');
        approvals[msg.sender] = true;
    }

    function finalize() public  {
        require(!atomicLock, 'Reentrancy attack blocked');
        atomicLock = true;
        require(state == EscrowState.Locked, 'Escrow is not in Locked state');
        require(approvals[buyer] == true, 'Buyer did not approve');
        require(approvals[lender] == true, 'Lender did not approve');
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