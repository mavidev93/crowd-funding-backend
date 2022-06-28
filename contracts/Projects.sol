//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

//errors
error Projects__addressHaveProject();

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
    }

    // TODO: try using project hash instead of author project it will solve the just one project for an address what problems it could cause!?

    mapping(address => Project) public s_authorToProject;

    mapping(bytes32 => funder[]) public s_projectHashedIdToFunders;
    address[] private s_authors;

    //add project
    function addProject(bytes32 projectHash, uint256 budget) public {
        if (s_authorToProject[msg.sender].author != address(0)) {
            revert Projects__addressHaveProject();
        }
        s_authorToProject[msg.sender] = Project(
            projectHash,
            msg.sender,
            budget
        );
        s_authors.push(msg.sender);
    }


    //getters
    function getAuthor(uint _authorIndex) public view returns(address){
           return s_authors[_authorIndex];
    }

}
