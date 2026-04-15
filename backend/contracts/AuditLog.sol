// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AuditLog {
    address public owner;
    event EventAnchored(bytes32 indexed eventHash, uint256 timestamp);
    constructor() { owner = msg.sender; }
    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    function anchor(bytes32 eventHash) external onlyOwner {
        emit EventAnchored(eventHash, block.timestamp);
    }
}