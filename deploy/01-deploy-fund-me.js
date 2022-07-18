const { networkConfig, developmentChain } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

// getNamedAccounts, deployments are abstracted from hre (hardhat runtime environment)
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let ethUsdPriceFeedAddress;

    // check if you're testing on the development chain. if so you're using mock price feeds
    if (developmentChain.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
        log("Using mock price feed!");
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
        log("Using testnet price feed!");
    }

    const args = [ethUsdPriceFeedAddress];
    // when going for localhost or hardhat network we want to use a mock. a copy of a real object to simulate how your script will function and interact with a mock
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // put price feed arguments
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    // if not development chain then you need to go through the verification process to verfiy the deployed contract on etherscan.
    if (
        !developmentChain.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }

    log("Fund Me Deployed!");
    log("-----------------------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
