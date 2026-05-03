// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
 
contract DIDRegistry {
    address public owner;
    address public pendingOwner;
    mapping(string => address) private didOwners;
    mapping(string => string)  private didPublicKeys;
    mapping(string => bool)    private deactivated;
 
    event DIDRegistered(string indexed did, address indexed owner);
    event DIDUpdated(string indexed did);
    event DIDDeactivated(string indexed did);
    event OwnershipTransferInitiated(address indexed newOwner);
    event OwnershipTransferred(address indexed prev, address indexed next);
 
    constructor() { owner = msg.sender; }
 
    modifier onlyOwner() {
        require(msg.sender == owner, "DIDRegistry: not owner"); _;
    }
    modifier onlyDIDOwner(string calldata did) {
        require(didOwners[did] == msg.sender, "DIDRegistry: not DID owner");
        require(!deactivated[did], "DIDRegistry: DID is deactivated"); _;
    }
    modifier didExists(string calldata did) {
        require(didOwners[did] != address(0), "DIDRegistry: DID not found"); _;
    }
 
    function registerDID(string calldata did, string calldata pubKey) external {
        require(didOwners[did] == address(0), "DID already exists");
        require(bytes(did).length > 0, "Empty DID");
        require(bytes(pubKey).length > 0, "Empty public key");
        didOwners[did]     = msg.sender;
        didPublicKeys[did] = pubKey;
        emit DIDRegistered(did, msg.sender);
    }
 
    function updatePublicKey(string calldata did, string calldata newPubKey)
        external onlyDIDOwner(did)
    {
        require(bytes(newPubKey).length > 0, "Empty public key");
        didPublicKeys[did] = newPubKey;
        emit DIDUpdated(did);
    }
 
    function deactivateDID(string calldata did) external onlyDIDOwner(did) {
        deactivated[did] = true;
        emit DIDDeactivated(did);
    }
 
    function getOwner(string calldata did)
        external view didExists(did) returns (address)
    { return didOwners[did]; }
 
    function getPublicKey(string calldata did)
        external view didExists(did) returns (string memory)
    {
        require(!deactivated[did], "DID is deactivated");
        return didPublicKeys[did];
    }
 
    function isDeactivated(string calldata did) external view returns (bool) {
        return deactivated[did];
    }
 
    function initiateOwnershipTransfer(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        pendingOwner = newOwner;
        emit OwnershipTransferInitiated(newOwner);
    }
 
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
}
