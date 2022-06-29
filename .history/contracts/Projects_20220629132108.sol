//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
// import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

import "hardhat/console.sol";

//errors
error Projects__addressHaveProject();
error Projects__notEnoughAmount();

contract Projects {
    // REFACTOR maybe use other data type instead of string and save some gas
    //every address can add one project
    struct funder {
        address funderAddress;
        uint256 amount;
    }

    struct Project {
        bytes32 projectHashId;
        address author;
        uint256 budget;
        uint256 date;
    }

    // TODO: try using project hash instead of author project it will solve the just one project for an address what problems it could cause!?

    mapping(bytes32 => Project) public s_projectHashedIdToProject;

    mapping(bytes32 => funder[]) public s_projectHashedIdToFunders;

    address[] private s_authors;
    uint256 i_minimumFundAmount;

    constructor(uint256 _minumumFundAmount) {
        i_minimumFundAmount = _minumumFundAmount;
    }

    //Events
    event ProjectAdded(address indexed author, bytes32 indexed projectHashId);

    //Functions
    function addProject(bytes32 _projectHashId, uint256 budget) public {
        // if (s_projectHashedIdToProject[_projectHashId].author != address(0)) {
        //     revert Projects__addressHaveProject();
        // }
        s_projectHashedIdToProject[_projectHashId] = Project(
            _projectHashId,
            msg.sender,
            budget,
            block.timestamp
        );
        s_authors.push(msg.sender);
        emit ProjectAdded(msg.sender, _projectHashId);
    }

    function fundProject(bytes32 _projectHashId) public payable {
        if (msg.value < i_minimumFundAmount) {
            revert Projects__notEnoughAmount();
        }
    }

    function expireProject(bytes32 _projectHashId) external {
     funder[] memory projectFunders=    s_projectHashedIdToFunders[_projectHashId];
     uint256 projectFundersLength = projectFunders.length;
     for (uint i=0;i<pro)
    }

    //getters
    function getAuthor(uint256 _authorIndex) public view returns (address) {
        return s_authors[_authorIndex];
    }
}
