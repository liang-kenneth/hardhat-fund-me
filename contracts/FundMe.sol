// Get funds from users
// Withdraw funds
// Set a minimum funding value in USD

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

// imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

// error codes
error FundMe__NotOwner();

// Interfaces
// Libraries

/** @title A Contract for crowdfunding
 *  @author Kenneth Liang
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements price feeds as our library
 */
contract FundMe {
    // Type declarations
    using PriceConverter for uint256;

    // State variables
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    AggregatorV3Interface private s_priceFeed;

    // Constants
    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 1e18;

    modifier onlyOwner() {
        // require(msg.sender == i_owner, "Sender is not owner!");
        // another way to check is the below if statement which is more gas efficient
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }

        _; // do the rest of the code. a place holder for the unmodified code
    }

    // function that gets called immediately when a contract gets deployed
    constructor(address priceFeedAddress) {
        i_owner = msg.sender; // the owners (caller) wallet address
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // receive and fallback are backup functions in case actual ETH is sent without the wallet calling the fund function
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    // Contracts can hold funds since they get deployed with a ETH address using the keyword "payable"
    function fund() public payable {
        // Want to be able to set a minimum fund aboutn in USD.

        // value is in ETH or some derivative of ETH like wei / gwei
        // require is a conditional statement,
        // if it fails the contract returns the remaining gas fees to the calling contract.
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to send more ETH!"
        ); // 1e18 == 1 * 10 ** 18 = 1000000000000000000 = 1 ETH

        // sender like value is a global always available keyword. sender = address of whoever calls the fund function.
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    // the onlyOwner modifier gets executed first before the withdraw function
    function withdraw() public onlyOwner {
        // remove the mapping amount for all addresses
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        // reset the funders address array
        s_funders = new address[](0);

        // msg.sender = address
        // payable(msg.sender) = payable address
        // with transfer, if it fails it reverts the transaction and throws an error
        // payable(msg.sender).transfer(address(this).balance); // "this" refers to the entire contract

        // send won't error but gives a boolean of whether or not it was successful
        // you need to accompany it with a require to throw an error message
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;

        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        // reset the funders address array
        s_funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
