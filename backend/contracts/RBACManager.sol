// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RBACManager {
    address public owner;
    mapping(address => string) private roles;
    event RoleAssigned(address indexed user, string role);
    constructor() { owner = msg.sender; }
    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    function assignRole(address user, string calldata role) external onlyOwner {
        roles[user] = role;
        emit RoleAssigned(user, role);
    }
    function getRole(address user) external view returns (string memory) {
        return roles[user];
    }
}