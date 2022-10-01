// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

// import "hardhat/console.sol";

contract SecretMessage {
    uint256 private seed;

    event NewMessage(address indexed from, uint256 timestamp, string message);

    struct Messages {
        address sender;
        string message;
        uint256 timestamp;
    }

    Messages[] messages;

    mapping(address => uint256) public lastMessageAt;

    constructor() payable {
        seed = (block.difficulty + block.timestamp) % 100;
        // console.log("This is my first console log from smart contract");
    }

    function sendMessage(string memory _secretMessage) public {
        require(
            lastMessageAt[msg.sender] + 1 minutes < block.timestamp,
            "Wait at least 15 minutes"
        );

        messages.push(Messages(msg.sender, _secretMessage, block.timestamp));
        // console.log("messaeg sent by: ", msg.sender);

        lastMessageAt[msg.sender] = block.timestamp;

        emit NewMessage(msg.sender, block.timestamp, _secretMessage);

        seed = (block.difficulty + block.timestamp + seed) % 100;
        if (seed < 50) {
            uint256 prizeAmount = 0.001 ether;
            require(
                prizeAmount <= address(this).balance,
                "Contract has not enough eth"
            );

            (bool success, ) = (msg.sender).call{value: prizeAmount}("");
            require(success, "Failed to withdraw money from the contract");
        }
    }

    function getAllMessages() public view returns (Messages[] memory) {
        return messages;
    }
}
