const { assert, expect } = require("chai");
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");

describe("FundMe", async function () {
    let fundMe;
    let deployer;
    let mockV3Aggregator;
    const sendValue = ethers.utils.parseEther("1"); // Send 1 ETH test amount

    // Deploying the FundMe contract for testing
    beforeEach(async function () {
        // const accounts = await ethers.getSingers();
        // const accountZero = accounts[0];
        // The above code does the same as the one below
        deployer = (await getNamedAccounts()).deployer; //which account you wanted connected to FundMe

        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer); // Gets the most recent deployed contract
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        );
    });

    // Test constructor
    describe("constructor", function () {
        it("sets the aggregator addresses correctly", async () => {
            const response = await fundMe.getPriceFeed();
            assert.equal(response, mockV3Aggregator.address);
        });
    });

    describe("fund", function () {
        it("fails if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to send more ETH!"
            );
        });

        it("updated the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue });
            const response = await fundMe.getAddressToAmountFunded(deployer);
            assert.equal(response.toString(), sendValue.toString());
        });

        it("adds funder to array of funders", async function () {
            await fundMe.fund({ value: sendValue });
            const funder = await fundMe.getFunder(0);
            assert.equal(funder, deployer);
        });
    });

    describe("withdraw", function () {
        beforeEach(async function () {
            await fundMe.fund({ value: sendValue });
        });

        it("withdraw ETH from a single funder", async function () {
            // Arrange - set up the test
            // This is the starting balance of the contract after it has been funded by 1 ETH
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            // Act
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingProviderBalance = await fundMe.provider.getBalance(
                deployer
            );

            // Assert
            assert.equal(endingFundMeBalance, 0);
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance),
                endingProviderBalance.add(gasCost).toString()
            );
        });

        it("Only allows the owner to withdraw", async function () {
            const accounts = await ethers.getSigners();
            const fundMeConnectedContract = await fundMe.connect(accounts[1]);
            await expect(fundMeConnectedContract.withdraw()).to.be.revertedWith(
                "FundMe__NotOwner"
            );
        });

        it("cheaperwithdraw testing...", async function () {
            // Arrange - set up the test
            // This is the starting balance of the contract after it has been funded by 1 ETH
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            // Act
            const transactionResponse = await fundMe.cheaperWithdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingProviderBalance = await fundMe.provider.getBalance(
                deployer
            );

            // Assert
            assert.equal(endingFundMeBalance, 0);
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance),
                endingProviderBalance.add(gasCost).toString()
            );
        });
    });
});
