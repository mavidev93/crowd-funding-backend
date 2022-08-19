//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.8;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

//Errors
error CrowdFund__NotOwner();
error CrowdFund__OnlyCampaignOwner();
error CrowdFund__GoalAmountMustBeMoreThanZero();
error CrowdFund__PeriodDaysShouldBeBetween1to365();
error CrowdFund__NotEnoughContributionAmount();
error CrowdFund__CampaignDoesNotExist();
error CrowdFund__CampaignIsClosed();
error CrowdFund__CantWithdrawGoalNotReached();
error CrowdFund__NoContributions();
error CrowdFund__ReclaimConditionsDoesNotMet();

contract CrowdFund {
    /* Requirements:

-  Anyone can create a new campaign.

-  Multiple campaigns can be created by single owner.

- Each contributor can fund multiple campaigns.

- Each campaign status is open or closed

- Campaign owner can withdraw funds only when required funding goal has been achieved (can withdraw before deadline has passed if funding goal is achieved).


- A Campaign is closed when:
            * deadline has passed (not closed when target goal amount is reached as campaign owner can collect more funds than the initial target) or
            * Campaign owner withdraws funds
            * Any time by the Campaign Owner for any reason.



- Each contributor can only claim refunds:
            * if deadline has passed and the required funding goal has not been achieved or
            *  if the deadline has not passed and the required funding goal has also not been achieved but the campaign has still been closed by the owner

*/

    //Events
    event Fund(address indexed from, string indexed campaign);

    address payable public owner; //owner of contract
    // uint256 totalCampaigns; //no. of campaigns
    using Counters for Counters.Counter;
    Counters.Counter private _campaignIds;
    // This is a type for a single Campaign.
    struct Campaign {
        address payable campaignOwner;
        // string campaignTitle;
        string campaignUrl;
        string campaignHash;
        // string campaignDescription;
        uint256 goalAmount; //in wei
        uint256 totalAmountFunded; //in wei
        uint256 deadline;
        bool goalAchieved;
        bool isCampaignOpen;
        bool isExists; //campaign exists or not. Campaign once created always exists even if closed
        //stores amount donated by each unique contributor
    }

    // This declares a state variable campaigns that stores a `Campaign` struct for each unique campaign ID.
    mapping(uint256 => string) public idToHash;
    mapping(string => Campaign) public hashToCampaign;
    mapping(string => mapping(address => uint256)) hashTOContributions;
    modifier onlyOwner() {
        // require(msg.sender == owner, "Only owner can call this function.");
        if (msg.sender != owner) revert CrowdFund__NotOwner();
        _;
    }

    modifier onlyCampaignOwner(string memory hash) {
        if (msg.sender != hashToCampaign[hash].campaignOwner)
            revert CrowdFund__OnlyCampaignOwner();
        _;
    }

    modifier campaignShouldExist(string memory hash) {
        if (!hashToCampaign[hash].isExists)
            revert CrowdFund__CampaignDoesNotExist();
        _;
    }

    constructor() {
        owner = payable(msg.sender);
    }

    //Creation of a campaign
    function createCampaign(
        string memory hash,
        // string memory _campaignUrl,
        uint256 _goalAmount,
        uint256 _fundingPeriodInDays
    ) public {
        // require(
        //     bytes(_campaignTitle).length != 0 &&
        //         bytes(_campaignDescription).length != 0,
        //     "Campaign Title and description cannot be empty!"
        // );
        if (_goalAmount <= 0) revert CrowdFund__GoalAmountMustBeMoreThanZero();
        if (_fundingPeriodInDays <= 1 && _fundingPeriodInDays >= 365)
            revert CrowdFund__PeriodDaysShouldBeBetween1to365();

        // ++totalCampaigns; //id of first campaign is 1 and not 0.
        _campaignIds.increment();
        uint256 campaignId = _campaignIds.current();
        idToHash[campaignId] = hash;
        Campaign storage aCampaign = hashToCampaign[hash];
        aCampaign.campaignOwner = payable(msg.sender);
        // aCampaign.campaignUrl = _campaignUrl;
        aCampaign.campaignHash = hash;

        aCampaign.goalAmount = _goalAmount;
        aCampaign.totalAmountFunded = 0;
        aCampaign.deadline = block.timestamp + _fundingPeriodInDays * 1 days;
        aCampaign.goalAchieved = false;
        aCampaign.isCampaignOpen = true;
        aCampaign.isExists = true;
    }

    //Funding of a campaign
    function fundCampaign(string memory _hash)
        public
        payable
        campaignShouldExist(_hash)
    {
        console.log(msg.value);
        if (msg.value < 10000000000000000)
            revert CrowdFund__NotEnoughContributionAmount();
        if (!hashToCampaign[_hash].isCampaignOpen)
            revert CrowdFund__CampaignIsClosed();

        checkCampaignDeadline(_hash);

        hashTOContributions[_hash][msg.sender] =
            (hashTOContributions[_hash][msg.sender]) +
            msg.value;
        hashToCampaign[_hash].totalAmountFunded =
            hashToCampaign[_hash].totalAmountFunded +
            msg.value;

        emit Fund(msg.sender,_hash,msg.value);
        //check if funding goal achieved
        if (
            hashToCampaign[_hash].totalAmountFunded >=
            hashToCampaign[_hash].goalAmount
        ) {
            hashToCampaign[_hash].goalAchieved = true;
        }
    }

    // Withdrawl of funds by Campaign Owner
    function withdrawFunds(string memory hash)
        public
        onlyCampaignOwner(hash)
        campaignShouldExist(hash)
    {
        if (!hashToCampaign[hash].goalAchieved)
            revert CrowdFund__CantWithdrawGoalNotReached();

        payable(msg.sender).transfer(hashToCampaign[hash].totalAmountFunded);

        hashToCampaign[hash].isCampaignOpen = false; //Close the campaign
    }

    //Reclaim of funds by a contributor
    function claimRefund(string memory hash) public campaignShouldExist(hash) {
        if (hashTOContributions[hash][msg.sender] <= 0)
            revert CrowdFund__NoContributions();

        checkCampaignDeadline(hash);

        if (
            (hashToCampaign[hash].isCampaignOpen) &&
            (hashToCampaign[hash].goalAchieved)
        ) revert CrowdFund__ReclaimConditionsDoesNotMet();

        payable(msg.sender).transfer(hashTOContributions[hash][msg.sender]);
        hashTOContributions[hash][msg.sender] = 0;
    }

    //Campaign owner can close a campaign anytime
    function closeCampaign(string memory hash) public onlyCampaignOwner(hash) {
        hashToCampaign[hash].isCampaignOpen = false;
    }

    // Contributor can view his/her contribution details for a campaign
    function getContributions(string memory hash)
        public
        view
        campaignShouldExist(hash)
        returns (uint256 contribution)
    {
        return hashTOContributions[hash][msg.sender];
    }

    //To check whether a campaign deadline has passed
    function checkCampaignDeadline(string memory hash)
        internal
        campaignShouldExist(hash)
    {
        if (block.timestamp > hashToCampaign[hash].deadline) {
            hashToCampaign[hash].isCampaignOpen = false; //Close the campaign
        }
    }

    function getAllCampaigns() public view returns (Campaign[] memory) {
        uint256 campaignCount = _campaignIds.current();
        Campaign[] memory campaigns = new Campaign[](campaignCount);
        for (uint256 i = 0; i < campaignCount; i++) {
            Campaign storage currentCampaign = hashToCampaign[idToHash[i]];
            campaigns[i] = currentCampaign;
        }
        return campaigns;
    }

    function getCampaignCount() public view returns (uint256) {
        return _campaignIds.current();
    }

    function getHashById(uint256 _id) public view returns (string memory) {
        return idToHash[_id];
    }

    function getCampaignByHash(string memory _hash)
        public
        view
        returns (Campaign memory)
    {
        return hashToCampaign[_hash];
    }


} // close the contract
