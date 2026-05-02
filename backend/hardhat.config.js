require("@nomicfoundation/hardhat-toolbox");

// FILL THESE IN — never commit real values to GitHub
const INFURA_KEY  = "YOUR_32_CHAR_INFURA_KEY";       // from infura.io
const PRIVATE_KEY = "YOUR_PRIVATE_KEY_WITHOUT_0x";   // from MetaMask (no 0x prefix)

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
