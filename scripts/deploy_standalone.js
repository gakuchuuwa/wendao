const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    // Connect to Localhost Hardhat Node (Port 8546)
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8546");

    // Account #1 Private Key (Switching from #0 to avoid nonce issues)
    const privateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("Deploying with account:", wallet.address);

    // Read Artifacts
    const mockUsdtPath = path.join(__dirname, "../artifacts/contracts/MockUSDT.sol/MockUSDT.json");
    const marketPath = path.join(__dirname, "../artifacts/contracts/WenDAOMarket.sol/WenDAOMarket.json");

    const mockUsdtJson = JSON.parse(fs.readFileSync(mockUsdtPath, "utf8"));
    const marketJson = JSON.parse(fs.readFileSync(marketPath, "utf8"));

    // Get current nonce
    let nonce = await provider.getTransactionCount(wallet.address);
    console.log("Current Nonce:", nonce);

    // Deploy MockUSDT
    console.log("Deploying MockUSDT...");
    const MockUSDTValues = new ethers.ContractFactory(mockUsdtJson.abi, mockUsdtJson.bytecode, wallet);
    const usdt = await MockUSDTValues.deploy({ nonce: nonce });
    await usdt.waitForDeployment();
    const usdtAddress = await usdt.getAddress();
    console.log("MockUSDT deployed to:", usdtAddress);

    // Increment nonce
    nonce++;

    // Deploy WenDAOMarket
    console.log("Deploying WenDAOMarket...");
    const MarketValues = new ethers.ContractFactory(marketJson.abi, marketJson.bytecode, wallet);
    const market = await MarketValues.deploy(usdtAddress, { nonce: nonce });
    await market.waitForDeployment();
    const marketAddress = await market.getAddress();
    console.log("WenDAOMarket deployed to:", marketAddress);

    console.log("\n!!! UPDATE frontend/constants/contracts.ts WITH THESE ADDRESSES !!!");
    console.log(`export const MOCK_USDT_ADDRESS = "${usdtAddress}";`);
    console.log(`export const WENDAO_MARKET_ADDRESS = "${marketAddress}";`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
