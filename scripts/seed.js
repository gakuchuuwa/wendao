const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Addresses from previous deployment (Use getAddress to format them correctly if needed)
const WENDAO_MARKET_ADDRESS = "0x71c95911e9a5d330f4d621842ec243ee1343292e";
const MOCK_USDT_ADDRESS = "0x8464135c8f25da09e49bc8782676a84730c318bc";

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8546");

    // Admin Account (Deployer) - Private Key #1
    const adminKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
    const adminWallet = new ethers.Wallet(adminKey, provider);

    // User Account (Test User) - Private Key #2
    const userKey = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
    const userWallet = new ethers.Wallet(userKey, provider);

    // Load Artifacts
    const mockUsdtPath = path.join(__dirname, "../artifacts/contracts/MockUSDT.sol/MockUSDT.json");
    const marketPath = path.join(__dirname, "../artifacts/contracts/WenDAOMarket.sol/WenDAOMarket.json");
    const mockUsdtJson = JSON.parse(fs.readFileSync(mockUsdtPath, "utf8"));
    const marketJson = JSON.parse(fs.readFileSync(marketPath, "utf8"));

    const marketAddress = ethers.getAddress(WENDAO_MARKET_ADDRESS);
    const usdtAddress = ethers.getAddress(MOCK_USDT_ADDRESS);

    const market = new ethers.Contract(marketAddress, marketJson.abi, adminWallet);
    const usdt = new ethers.Contract(usdtAddress, mockUsdtJson.abi, adminWallet);

    console.log("Seeding data...");

    // 1. Create Market if not exists
    let nonce = await provider.getTransactionCount(adminWallet.address);

    try {
        console.log("Creating Market #0...");
        const tx = await market.createMarket("比特币在本月底会突破 100,000 美元吗？", 86400 * 30, { nonce: nonce++ });
        await tx.wait();
        console.log("Market #0 Created.");
    } catch (e) {
        console.log("Market creation might have failed", e.message.substring(0, 100));
        nonce = await provider.getTransactionCount(adminWallet.address);
    }

    // 2. Mint USDT to Admin and User
    console.log("Minting USDT...");
    // Mint to Admin
    await (await usdt.faucet(adminWallet.address, ethers.parseUnits("10000", 6), { nonce: nonce++ })).wait();

    // Mint to User
    await (await usdt.faucet(userWallet.address, ethers.parseUnits("10000", 6), { nonce: nonce++ })).wait();

    // 3. Place some bets to make it look alive
    console.log("Placing initial bets...");
    const betAmountYes = ethers.parseUnits("500", 6);
    const betAmountNo = ethers.parseUnits("300", 6);

    // Admin approves and bets YES
    await (await usdt.approve(marketAddress, betAmountYes, { nonce: nonce++ })).wait();
    await (await market.placeBet(0, 1, betAmountYes, { nonce: nonce++ })).wait(); // 1 = YES
    console.log("Admin bet 500 YES");

    // User approves and bets NO (Need separate nonce for user)
    let userNonce = await provider.getTransactionCount(userWallet.address);
    const usdtUser = usdt.connect(userWallet);
    const marketUser = market.connect(userWallet);

    await (await usdtUser.approve(marketAddress, betAmountNo, { nonce: userNonce++ })).wait();
    await (await marketUser.placeBet(0, 2, betAmountNo, { nonce: userNonce++ })).wait(); // 2 = NO
    console.log("User bet 300 NO");

    console.log("\nSeeding Complete! Refresh your browser.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
