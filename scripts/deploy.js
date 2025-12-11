const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy MockUSDT
    const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
    const usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();
    const usdtAddress = await usdt.getAddress();
    console.log("MockUSDT deployed to:", usdtAddress);

    // 2. Deploy WenDAOMarket
    const WenDAOMarket = await hre.ethers.getContractFactory("WenDAOMarket");
    const market = await WenDAOMarket.deploy(usdtAddress);
    await market.waitForDeployment();
    const marketAddress = await market.getAddress();
    console.log("WenDAOMarket deployed to:", marketAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
