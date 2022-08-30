import { timeStamp } from "console"
//Third Party
import { assert, expect } from "chai"
import { ethers, getNamedAccounts, deployments, network } from "hardhat"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { BigNumber } from "ethers"

//App
import { developmentChains, networkConfig } from "../../helper.hardhat.config"
import { CrowdFund } from "../../typechain-types"
import {
    MINIMUM_GOAL_AMOUNT,
    MINIMUM_FUND_AMOUNT,
} from "../../deploy/01-deploy-CrowdFund"
import { log } from "console"

//Constants
const HASH = "kjfdjfosdfjsdlfjksdklo/Canvas"
const ACCEPTABLE_DAYS = 1

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("CrowdFund unit test", () => {
          let crowdFund: CrowdFund
          let crowdFundFunder: CrowdFund
          let crowdFundContract: CrowdFund
          let deployer: SignerWithAddress
          let user: SignerWithAddress
          let funder: SignerWithAddress
          let accounts: SignerWithAddress[]

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              user = accounts[1]
              funder = accounts[2]
              await deployments.fixture(["CrowdFund"])
              crowdFundContract = await ethers.getContract("CrowdFund")
              crowdFund = crowdFundContract.connect(user)
              crowdFundFunder = crowdFundContract.connect(funder)
          })

          describe("constructor", () => {
              it("check deployer and owner address equality", async () => {
                  const owner = await crowdFund.owner()
                  assert.equal(deployer.address, owner)
              })
              it("minimum amounts", async () => {
                  const minimumGoal = await crowdFund.minimum_goalAmount()
                  const minimumFund = await crowdFund.minimum_fundAmount()
                  assert.equal(minimumGoal.toNumber(), MINIMUM_GOAL_AMOUNT)
                  assert.equal(minimumFund.toNumber(), MINIMUM_FUND_AMOUNT)
              })
              it("0 campaign count at first", async () => {
                  const currentCampaignCount =
                      await crowdFund.getCampaignCount()
                  assert.equal(currentCampaignCount.toNumber(), 0)
              })
          })

          describe("createCampaign", () => {
              it("revert when goal amount is lower than minimum", async () => {
                  await expect(
                      crowdFund.createCampaign(
                          HASH,
                          MINIMUM_GOAL_AMOUNT - 1,
                          15
                      )
                  ).to.be.revertedWith(
                      "CrowdFund__GoalAmountMustBeMoreThanMinimum()"
                  )
              })

              it("revert when Days is lower than minimum(1)", async () => {
                  await expect(
                      crowdFund.createCampaign(HASH, MINIMUM_GOAL_AMOUNT, 0)
                  ).to.be.revertedWith(
                      "CrowdFund__PeriodDaysShouldBeBetween1to365()"
                  )
              })

              it("emit Create event ", async () => {
                  await expect(
                      crowdFund.createCampaign(
                          HASH,
                          MINIMUM_GOAL_AMOUNT,
                          ACCEPTABLE_DAYS
                      )
                  ).to.emit(crowdFund, "Create")
              })

              it("check fresh campaign data", async () => {
                  const tx = await crowdFund.createCampaign(
                      HASH,
                      MINIMUM_GOAL_AMOUNT,
                      ACCEPTABLE_DAYS
                  )

                  const txRecipe = await tx.wait()
                  const blockHash: string = txRecipe.blockHash
                  const block = await ethers.provider.getBlock(blockHash)
                  const { timestamp } = block
                  const campaign = await crowdFund.getCampaignByHash(HASH)
                  assert.equal(campaign.campaignHash, HASH)
                  assert.equal(campaign.isExists, true)
                  assert.equal(campaign.isCampaignOpen, true)
                  assert.equal(campaign.isOwnerWithdraw, false)
                  assert.equal(campaign.id.toNumber(), 1)
                  //check deadline
                  assert.equal(
                      campaign.deadline.toNumber(),
                      timestamp + ACCEPTABLE_DAYS * 24 * 60 * 60
                  )
              })
          })
          describe("fund campaign", () => {
              it("revert when fund amount lower than minimum", async () => {
                  const tx = await crowdFund.createCampaign(
                      HASH,
                      MINIMUM_GOAL_AMOUNT,
                      ACCEPTABLE_DAYS
                  )
               

              })
          })
      })
