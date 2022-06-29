//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
// import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

import "hardhat/console.sol";

//errors
error Projects__budgetAmountIsLow();
error Projects__notEnoughAmount();

contract Projects {
    modifier onlyOwner() {
        require(msg.sender == i_owner);
        _;
    }

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
        uint256 fundedAmount;
        uint256 date;
    }

    // TODO: try using project hash instead of author project it will solve the just one project for an address what problems it could cause!?

    mapping(bytes32 => Project) public s_projectHashedIdToProject;

    mapping(bytes32 => funder[]) public s_projectHashedIdToFunders;

    address[] private s_authors;
    uint256 immutable i_minimumFundAmount;
    uint256 immutable i_minimumBudgetAmount;
    address private immutable i_owner;

    constructor(uint256 _minimumFundAmount, uint256 _minimumBudgetAmount) {
        i_owner = msg.sender;
        i_minimumFundAmount = _minimumFundAmount;
        i_minimumBudgetAmount = _minimumBudgetAmount;
    }

    //Events
    event ProjectAdded(address indexed author, bytes32 indexed projectHashId);

    //Functions
    function addProject(bytes32 _projectHashId, uint256 budget) public {
        if (budget < i_minimumBudgetAmount) {
            revert Projects__budgetAmountIsLow();
        }
        s_projectHashedIdToProject[_projectHashId] = Project(
            _projectHashId,
            msg.sender,
            budget,
            0,
            block.timestamp
        );
        s_authors.push(msg.sender);
        emit ProjectAdded(msg.sender, _projectHashId);
    }

    function fundProject(bytes32 _projectHashId) public payable {
        if (msg.value < i_minimumFundAmount) {
            revert Projects__notEnoughAmount();
        }

        s_projectHashedIdToProject[_projectHashId].fundedAmount +=msg.value;
        s_projectHashedIdToFunders[_projectHashId].push(funder(msg.sender,msg.value));

    }

    //expire project and return funds to funders
    function expireProject(bytes32 _projectHashId) external onlyOwner {
        funder[] memory projectFunders = s_projectHashedIdToFunders[
            _projectHashId
        ];
        uint256 projectFundersLength = projectFunders.length;
        for (uint256 i = 0; i < projectFundersLength; i++) {
            projectFunders[i].funderAddress.call{
                value: projectFunders[i].amount
            };
        }
    }



    //getters
    function getAuthor(uint256 _authorIndex) public view returns (address) {
        return s_authors[_authorIndex];
    }

    function getProjectFundedAmount(bytes32 _projectHashId) public view returns(uint)
}
