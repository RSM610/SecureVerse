// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DIDRegistry {
    mapping(string => address) private didOwners;
    mapping(string => string)  private didPublicKeys;
    event DIDRegistered(string did, address owner);

    function registerDID(string calldata did, string calldata pubKey) external {
        require(didOwners[did] == address(0), "DID already exists");
        didOwners[did]     = msg.sender;
        didPublicKeys[did] = pubKey;
        emit DIDRegistered(did, msg.sender);
    }
    function getOwner(string calldata did) external view returns (address) {
        return didOwners[did];
    }
    function getPublicKey(string calldata did) external view returns (string memory) {
        return didPublicKeys[did];
    }
}