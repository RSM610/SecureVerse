const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("  SecureVerse Contract Deployment to Sepolia");
  console.log("=================================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    console.error("ERROR: No ETH. Get Sepolia ETH from sepoliafaucet.com first.");
    process.exit(1);
  }

  // 1 — DIDRegistry
  console.log("1/3  Deploying DIDRegistry...");
  const DIDRegistry = await hre.ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistry.deploy();
  await didRegistry.waitForDeployment();
  const didAddr = await didRegistry.getAddress();
  console.log("     ✓ DIDRegistry:", didAddr);

  // 2 — RBACManager
  console.log("2/3  Deploying RBACManager...");
  const RBACManager = await hre.ethers.getContractFactory("RBACManager");
  const rbacManager = await RBACManager.deploy();
  await rbacManager.waitForDeployment();
  const rbacAddr = await rbacManager.getAddress();
  console.log("     ✓ RBACManager:", rbacAddr);

  // 3 — AuditLog
  console.log("3/3  Deploying AuditLog...");
  const AuditLog = await hre.ethers.getContractFactory("AuditLog");
  const auditLog = await AuditLog.deploy();
  await auditLog.waitForDeployment();
  const auditAddr = await auditLog.getAddress();
  console.log("     ✓ AuditLog:", auditAddr);

  // Save addresses to JSON
  const out = {
    DIDRegistry: didAddr,
    RBACManager: rbacAddr,
    AuditLog:    auditAddr,
    deployer:    deployer.address,
    network:     "sepolia",
    deployedAt:  new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(__dirname, "../deployed-addresses.json"),
    JSON.stringify(out, null, 2)
  );

  console.log("\n=================================================");
  console.log("  DONE — paste these into backend/.env");
  console.log("=================================================");
  console.log(`DIDREGISTRY_ADDRESS=${didAddr}`);
  console.log(`RBACMANAGER_ADDRESS=${rbacAddr}`);
  console.log(`AUDITLOG_ADDRESS=${auditAddr}`);
  console.log("\nVerify on Etherscan:");
  console.log(`  https://sepolia.etherscan.io/address/${didAddr}`);
  console.log(`  https://sepolia.etherscan.io/address/${rbacAddr}`);
  console.log(`  https://sepolia.etherscan.io/address/${auditAddr}`);
}

main().catch((err) => {
  console.error("\nDeployment failed:", err.message);
  process.exit(1);
});
