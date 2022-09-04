//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.8;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

//Errors
error CrowdFund__NotOwner();
error CrowdFund__OnlyCampaignOwner();
error CrowdFund__GoalAmountMustBeMoreThanMinimum();
error CrowdFund__PeriodDaysShouldBeBetween1to365();
error CrowdFund__NotEnoughContributionAmount();
error CrowdFund__CampaignDoesNotExist();
error CrowdFund__CampaignIsClosed();
error CrowdFund__CantWithdrawGoalNotReached();
error CrowdFund__NoContributions();
error CrowdFund__ReclaimConditionsDoesNotMet();
error CrowdFund__AlreadyWithdraw();

contract CrowdFund {
    address payable public owner; //owner of contract
    uint256 public minimum_goalAmount;
    uint256 public minimum_fundAmount;
    using Counters for Counters.Counter;
    Counters.Counter private _campaignIds;
    // This is a type for a single Campaign.
    struct Campaign {
        address payable campaignOwner;
        uint256 id;
        string campaignUrl;
        string campaignHash;
        uint256 goalAmount; //in wei
        uint256 totalAmountFunded; //in wei
        uint256 deadline;
        bool goalAchieved;
        bool isCampaignOpen;
        bool isExists; //campaign exists or not. Campaign once created always exists even if closed
        bool isOwnerWithdraw;
        //stores amount donated by each unique contributor
    }

    // This declares a state variable campaigns that stores a `Campaign` struct for each unique campaign ID.
    mapping(uint256 => string) public idToHash;
    mapping(string => Campaign) public hashToCampaign;
    mapping(string => mapping(address => uint256)) hashToContributions;
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

    //Events
    event Create(address indexed campaignOwner, uint256 indexed id);
    event Fund(
        address indexed from,
        uint256 indexed amount,
        uint256 indexed id
    );
    event Test(address indexed from, uint256 indexed testId);

    constructor(uint256 _minimum_goalAmount, uint256 _minimum_fundAmount) {
        owner = payable(msg.sender);
        minimum_goalAmount = _minimum_goalAmount;
        console.log("minimum goal amount");
        console.log(_minimum_goalAmount);
        minimum_fundAmount = _minimum_fundAmount;
    }

    //Creation of a campaign
    function createCampaign(
        string memory hash,
        uint256 _goalAmount,
        uint256 _fundingPeriodInDays
    ) public {
        console.log("goal amount");
        console.log(_goalAmount);
        if (_goalAmount < minimum_goalAmount)
            revert CrowdFund__GoalAmountMustBeMoreThanMinimum();
        if (_fundingPeriodInDays < 1 || _fundingPeriodInDays > 365)
            revert CrowdFund__PeriodDaysShouldBeBetween1to365();

        //id of first campaign is 1 and not 0
        _campaignIds.increment();
        uint256 campaignId = _campaignIds.current();
        idToHash[campaignId] = hash;
        Campaign storage aCampaign = hashToCampaign[hash];
        aCampaign.campaignOwner = payable(msg.sender);
        aCampaign.id = campaignId;
        // aCampaign.campaignUrl = _campaignUrl;
        aCampaign.campaignHash = hash;

        aCampaign.goalAmount = _goalAmount;
        aCampaign.totalAmountFunded = 0;
        aCampaign.deadline = block.timestamp + _fundingPeriodInDays * 1 days;
        aCampaign.goalAchieved = false;
        aCampaign.isCampaignOpen = true;
        aCampaign.isExists = true;
        aCampaign.isOwnerWithdraw = false;
        emit Create(msg.sender, campaignId);
    }

    //Funding of a campaign
    function fundCampaign(string memory hash)
        public
        payable
        campaignShouldExist(hash)
    {
        if (msg.value < minimum_fundAmount)
            revert CrowdFund__NotEnoughContributionAmount();
        checkCampaignDeadline(hash);

        if (!hashToCampaign[hash].isCampaignOpen)
            revert CrowdFund__CampaignIsClosed();
        checkCampaignDeadline(hash);
        hashToContributions[hash][msg.sender] =
            (hashToContributions[hash][msg.sender]) +
            msg.value;
        hashToCampaign[hash].totalAmountFunded =
            hashToCampaign[hash].totalAmountFunded +
            msg.value;
        console.log(hash);
        emit Fund(msg.sender, msg.value, hashToCampaign[hash].id);
        //check if funding goal achieved
        if (
            hashToCampaign[hash].totalAmountFunded >=
            hashToCampaign[hash].goalAmount
        ) {
            hashToCampaign[hash].goalAchieved = true;
        }
    }

    // Withdraw of funds by Campaign Owner
    function withdrawFunds(string memory hash)
        public
        onlyCampaignOwner(hash)
        campaignShouldExist(hash)
    {
        if (!hashToCampaign[hash].goalAchieved)
            revert CrowdFund__CantWithdrawGoalNotReached();
        if (hashToCampaign[hash].isOwnerWithdraw)
            revert CrowdFund__AlreadyWithdraw();
        payable(msg.sender).transfer(hashToCampaign[hash].totalAmountFunded);
        hashToCampaign[hash].isOwnerWithdraw = true;
        hashToCampaign[hash].isCampaignOpen = false; //Close the campaign
    }

    //Reclaim of funds by a contributor
    function claimRefund(string memory hash) public campaignShouldExist(hash) {
        if (hashToContributions[hash][msg.sender] <= 0)
            revert CrowdFund__NoContributions();

        checkCampaignDeadline(hash);

        if (
            (hashToCampaign[hash].isCampaignOpen) ||
            (hashToCampaign[hash].goalAchieved)
        ) revert CrowdFund__ReclaimConditionsDoesNotMet();

        payable(msg.sender).transfer(hashToContributions[hash][msg.sender]);
        hashToContributions[hash][msg.sender] = 0;
    }

    //Campaign owner can close a campaign anytime
    function closeCampaign(string memory hash) public onlyCampaignOwner(hash) {
        if (!hashToCampaign[hash].isCampaignOpen)
            revert CrowdFund__CampaignIsClosed();
        hashToCampaign[hash].isCampaignOpen = false;
    }

    // Contributor can view his/her contribution details for a campaign
    function getContributions(string memory hash)
        public
        view
        campaignShouldExist(hash)
        returns (uint256 contribution)
    {
        return hashToContributions[hash][msg.sender];
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

    function getCampaignByHash(string memory hash)
        public
        view
        returns (Campaign memory)
    {
        return hashToCampaign[hash];
    }
} // close the contract
