require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const INFURA_PROJECT_ID    = process.env.INFURA_PROJECT_ID;
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

// Conditional network: only add sepolia if both vars are present and valid
const networks = {
  hardhat: {},
};

if (INFURA_PROJECT_ID && DEPLOYER_PRIVATE_KEY && DEPLOYER_PRIVATE_KEY.length === 64) {
  networks.sepolia = {
    url: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
    accounts: [`0x${DEPLOYER_PRIVATE_KEY}`],
    chainId: 11155111,
  };
} else {
  console.warn("⚠️  Sepolia network disabled: missing or invalid INFURA_PROJECT_ID / DEPLOYER_PRIVATE_KEY");
}

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks,
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};