// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BulkPayout {

    uint256 public constant MAX_RECIPIENTS = 20;

    struct PayoutLog {
        uint256 payoutId;
        uint256 timestamp;
        address[] recipients;
        uint256[] amounts;
        string label;
    }

    mapping(address => PayoutLog[]) public history;

    event BulkSent(address indexed sender, uint256 payoutId, uint256 recipientCount, uint256 totalAmount, string label);

    function bulkSend(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        string calldata _label
    ) external payable {
        require(_recipients.length > 0, "No recipients");
        require(_recipients.length <= MAX_RECIPIENTS, "Too many recipients");
        require(_recipients.length == _amounts.length, "Length mismatch");

        uint256 total = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            require(_recipients[i] != address(0), "Invalid address");
            require(_amounts[i] > 0, "Invalid amount");
            total += _amounts[i];
        }
        require(msg.value == total, "Value mismatch");

        for (uint256 i = 0; i < _recipients.length; i++) {
            payable(_recipients[i]).transfer(_amounts[i]);
        }

        history[msg.sender].push(PayoutLog({
            payoutId: history[msg.sender].length,
            timestamp: block.timestamp,
            recipients: _recipients,
            amounts: _amounts,
            label: _label
        }));

        emit BulkSent(msg.sender, history[msg.sender].length - 1, _recipients.length, total, _label);
    }

    function getHistory(address sender) external view returns (PayoutLog[] memory) {
        return history[sender];
    }

    function getPayoutCount(address sender) external view returns (uint256) {
        return history[sender].length;
    }

    receive() external payable {}
}
