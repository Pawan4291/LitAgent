// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Escrow {

    enum Status { Pending, Released, Refunded }

    struct EscrowDeal {
        address buyer;
        address seller;
        uint256 amount;
        uint256 deadline;
        string label;
        Status status;
    }

    EscrowDeal[] public escrows;
    mapping(address => uint256[]) public buyerEscrows;
    mapping(address => uint256[]) public sellerEscrows;

    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, uint256 deadline, string label);
    event EscrowReleased(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount);

    function createEscrow(
        address _seller,
        uint256 _deadlineSeconds,
        string calldata _label
    ) external payable returns (uint256) {
        require(msg.value > 0, "Send zkLTC");
        require(_seller != address(0) && _seller != msg.sender, "Invalid seller");
        require(_deadlineSeconds > 0, "Invalid deadline");

        uint256 escrowId = escrows.length;
        escrows.push(EscrowDeal({
            buyer: msg.sender,
            seller: _seller,
            amount: msg.value,
            deadline: block.timestamp + _deadlineSeconds,
            label: _label,
            status: Status.Pending
        }));

        buyerEscrows[msg.sender].push(escrowId);
        sellerEscrows[_seller].push(escrowId);

        emit EscrowCreated(escrowId, msg.sender, _seller, msg.value, block.timestamp + _deadlineSeconds, _label);
        return escrowId;
    }

    function release(uint256 _escrowId) external {
        EscrowDeal storage deal = escrows[_escrowId];
        require(msg.sender == deal.buyer, "Only buyer can release");
        require(deal.status == Status.Pending, "Already settled");

        deal.status = Status.Released;
        payable(deal.seller).transfer(deal.amount);

        emit EscrowReleased(_escrowId, deal.buyer, deal.seller, deal.amount);
    }

    function refund(uint256 _escrowId) external {
        EscrowDeal storage deal = escrows[_escrowId];
        require(deal.status == Status.Pending, "Already settled");
        require(block.timestamp >= deal.deadline, "Deadline not reached");

        deal.status = Status.Refunded;
        payable(deal.buyer).transfer(deal.amount);

        emit EscrowRefunded(_escrowId, deal.buyer, deal.amount);
    }

    function getBuyerEscrows(address _buyer) external view returns (EscrowDeal[] memory) {
        uint256[] memory ids = buyerEscrows[_buyer];
        EscrowDeal[] memory result = new EscrowDeal[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = escrows[ids[i]];
        }
        return result;
    }

    function getSellerEscrows(address _seller) external view returns (EscrowDeal[] memory) {
        uint256[] memory ids = sellerEscrows[_seller];
        EscrowDeal[] memory result = new EscrowDeal[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = escrows[ids[i]];
        }
        return result;
    }

    receive() external payable {}
}
