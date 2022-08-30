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
          let createCampaign: any
          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              user = accounts[1]
              funder = accounts[2]
              await deployments.fixture(["CrowdFund"])
              crowdFundContract = await ethers.getContract("CrowdFund")
              crowdFund = crowdFundContract.connect(user)
              crowdFundFunder = crowdFundContract.connect(funder)
              createCampaign = () => {
                  log("-------------------")
                  log("create campaign")
                  return crowdFund.createCampaign(
                      HASH,
                      MINIMUM_GOAL_AMOUNT,
                      ACCEPTABLE_DAYS
                  )
              }
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
                  const crateTx = await crowdFund.createCampaign(
                      HASH,
                      MINIMUM_GOAL_AMOUNT,
                      ACCEPTABLE_DAYS
                  )
                  await expect(
                      crowdFundFunder.fundCampaign(HASH, {
                          value: MINIMUM_FUND_AMOUNT - 1,
                      })
                  ).to.be.revertedWith(
                      "CrowdFund__NotEnoughContributionAmount()"
                  )
              })

              it("revert when campaign is close", async () => {
                  const createTx = await crowdFund.createCampaign(
                      HASH,
                      MINIMUM_GOAL_AMOUNT,
                      ACCEPTABLE_DAYS
                  )
                  const closeTx = await crowdFund.closeCampaign(HASH)
                  await closeTx.wait()
                  await expect(
                      crowdFundFunder.fundCampaign(HASH, {
                          value: MINIMUM_FUND_AMOUNT,
                      })
                  ).to.be.revertedWith("CrowdFund__CampaignIsClosed()")
              })

              it("store the funder with the value", async () => {
                  const createTx = await crowdFund.createCampaign(
                      HASH,
                      MINIMUM_GOAL_AMOUNT,
                      ACCEPTABLE_DAYS
                  )
                  await crowdFundFunder.fundCampaign(HASH, {
                      value: MINIMUM_FUND_AMOUNT,
                  })
                  const fundedFromContract =
                      await crowdFundFunder.getContributions(HASH)
                  assert.equal(
                      MINIMUM_FUND_AMOUNT,
                      fundedFromContract.toNumber()
                  )
              })

              it("add funded value to total fund value", async () => {
                  const createTx = await crowdFund.createCampaign(
                      HASH,
                      MINIMUM_GOAL_AMOUNT,
                      ACCEPTABLE_DAYS
                  )
                  await crowdFundFunder.fundCampaign(HASH, {
                      value: MINIMUM_FUND_AMOUNT,
                  })

                  const campaign = await crowdFund.getCampaignByHash(HASH)
                  assert.equal(
                      campaign.totalAmountFunded.toNumber(),
                      MINIMUM_FUND_AMOUNT
                  )
              })

              it("emit Fund event in funding", async () => {
                  const createTx = await crowdFund.createCampaign(
                      HASH,
                      MINIMUM_GOAL_AMOUNT,
                      ACCEPTABLE_DAYS
                  )
                  await expect(
                      crowdFund.fundCampaign(HASH, {
                          value: MINIMUM_FUND_AMOUNT,
                      })
                  ).to.emit(crowdFund, "Fund")
              })
          })

          describe("withdraw", () => {
              it("revert when other user than campaign owner call", async () => {
                  const CreateTx = await createCampaign()
                  await crowdFundFunder.fundCampaign(HASH, {
                      value: MINIMUM_GOAL_AMOUNT,
                  })
                  await expect(
                      crowdFundFunder.withdrawFunds(HASH)
                  ).to.be.revertedWith("CrowdFund__OnlyCampaignOwner()")
              })

              it("revert when goal is not achieved", async () => {
                  const CreateTx = await createCampaign()
                  await crowdFundFunder.fundCampaign(HASH, {
                      value: MINIMUM_FUND_AMOUNT,
                  })
                  await expect(
                      crowdFund.withdrawFunds(HASH)
                  ).to.be.revertedWith(
                      "CrowdFund__CantWithdrawGoalNotReached()"
                  )
              })

              it("close campaign and set the isWithdraw to true", async () => {
                  const CreateTx = await createCampaign()
                  await crowdFundFunder.fundCampaign(HASH, {
                      value: MINIMUM_GOAL_AMOUNT,
                  })
                  const withDrawTx = await crowdFund.withdrawFunds(HASH)

                  const campaign = await crowdFund.getCampaignByHash(HASH)

                  assert.equal(campaign.isCampaignOpen, false)
                  assert.equal(campaign.isOwnerWithdraw, true)
              })

              it("transfer the funds to campaign owner after withdraw", async () => {
                  const CreateTx = await createCampaign()


                  await crowdFundFunder.fundCampaign(HASH, {
                      value: MINIMUM_GOAL_AMOUNT,
                  })

                  const withdrawTx = await crowdFund.withdrawFunds(HASH)
                  await expect(
                    withdrawTx
                  ).to.changeEtherBalance(user, +MINIMUM_GOAL_AMOUNT)
              })

              it("only can withdraw once", async () => {
                  const createTx = await createCampaign()
                  await crowdFundFunder.fundCampaign(HASH, {
                      value: MINIMUM_GOAL_AMOUNT,
                  })
                  const withDrawTx = await crowdFund.withdrawFunds(HASH)
                  await expect(
                      crowdFund.withdrawFunds(HASH)
                  ).to.be.revertedWith("CrowdFund__AlreadyWithdraw()")
              })
          })

          describe("claim refund",async()=>{
            it("revert when there is no contribution",async()=>{
                const createTx = await createCampaign()
               await expect (crowdFundFunder.claimRefund(HASH)).to.be.revertedWith("CrowdFund__NoContributions()")
            })

            it("revert when reclaim conditions not met",async()=>{
                const createTx = await createCampaign()

                await crowdFundFunder.fundCampaign(HASH,{value:MINIMUM_GOAL_AMOUNT-1})
                //goal not achieved but campaign is open
                await expect(crowdFundFunder.claimRefund(HASH)).to.be.revertedWith("CrowdFund__ReclaimConditionsDoesNotMet()")

                await crowdFundFunder.fundCampaign(HASH,{value:MINIMUM_GOAL_AMOUNT})
                //goal achieved but campaign but campaign is open
                await expect(crowdFundFunder.claimRefund(HASH)).to.be.revertedWith("CrowdFund__ReclaimConditionsDoesNotMet()")
            })

            it("transfer fund when claim condition met",async()=>{
                const createTx = await createCampaign()

                await crowdFundFunder.fundCampaign(HASH,{value:MINIMUM_GOAL_AMOUNT-1})
                //close campaign
               await crowdFund.closeCampaign(HASH)
               const claimRefundTx = await crowdFundFunder.claimRefund(HASH)
                //check transfer to funder in claimRefund
               await expect(claimRefundTx).to.changeEtherBalance(funder,MINIMUM_GOAL_AMOUNT-1)

            })
          })
        describe("close campaign",()=>{
            it("revert when campaign is already closed",async()=>{
                const createTx = await createCampaign()
                await crowdFund.closeCampaign(HASH)
                await expect(crowdFund.closeCampaign(HASH)).to.be.revertedWith("CrowdFund__CampaignIsClosed()")
            })

            it("set campaignIsOpen to false",async()=>{
                const createTx = await createCampaign()
                await crowdFund.closeCampaign(HASH)
                const campaign =awit crowdFund.getCampaignByHash(HASH)
                assert.equal(campaign.is)
            })


        })
      })
