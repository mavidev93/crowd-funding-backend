//Third Party
import { assert, expect } from "chai"
import { ethers, getNamedAccounts, deployments, network } from "hardhat"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { BigNumber } from "ethers"

//App
import { developmentChains, networkConfig } from "../../helper.hardhat.config"
import { CrowdFund } from "../../typechain-types"
import { MINIMUM_GOAL_AMOUNT,MINIMUM_FUND_AMOUNT } from "../../deploy/01-deploy-CrowdFund"
import { log } from "console"
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("CrowdFund unit test", () => {
          let crowdFund: CrowdFund
          let crowdFundContract: CrowdFund
          let deployer: SignerWithAddress
          let user: SignerWithAddress
          let accounts: SignerWithAddress[]

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              user = accounts[1]
              await deployments.fixture(["CrowdFund"])
              crowdFundContract = await ethers.getContract("CrowdFund")
              crowdFund = crowdFundContract.connect(user)
          })

          describe("constructor", () => {
              it("check deployer and owner address equality", async () => {
                  const owner = await crowdFund.owner()
                  assert.equal(deployer.address, owner)
              })
              it("minimum amounts",async()=>{
                const minimumGoal = await crowdFund.minimum_goalAmount()
                const minimumFund = await crowdFund.minimum_fundAmount()
                assert.equal(minimumGoal.toNumber(),MINIMUM_GOAL_AMOUNT)
                assert.equal(minimumFund.toNumber(),MINIMUM_FUND_AMOUNT)
              })
              it("0 campaign count at first", async () => {
                  const currentCampaignCount =
                      await crowdFund.getCampaignCount()
                assert.equal(currentCampaignCount.toNumber(),0)
              })

          })

          describe("createCampaign",()=>{
            it("revert when goal amount is lower than minimum",async()=>{
                expect(await crowdFund.createCampaign("dfjosidfjiof",MINIMUM_GOAL_AMOUNT-1,15)).to.be.revertedWith("CrowdFund__GoalAmountMustBeMoreThanMinimum()")
                    })
          })
      })

//App
// import { Projects } from "../../typechain-types/Projects"
// import {MINIMUM_BUDGET,MINIMUM_FUND_AMOUNT} from '../../deploy/01-deploy-projects'
//types
// type address = string;

// //CONSTANTES
// const BUDGET = MINIMUM_BUDGET
// const PROJECTHASHID = ethers.utils.id("salam")

// describe("Projects", function () {
//     let projects: Projects, deployer: address, funder:address
//     this.beforeEach(async () => {
//         deployer = (await getNamedAccounts()).deployer
//         funder = (await getNamedAccounts()).funder
//         console.log(`funder is: ${funder}`)
//         await deployments.fixture(["all"])
//         projects = await ethers.getContract("Projects", deployer)
//     })

//     describe("add project", () => {
//         it("add author to authors array", async () => {
//             const transactionResponse = await projects.addProject(
//                 PROJECTHASHID,
//                 BUDGET
//             )
//             // const transactionRecipe = transactionResponse.wait(1)
//             const authorFromContract = await projects.getAuthor(0)
//             assert.equal(deployer, authorFromContract)
//         })

//         it("revert when budget is low than minimum", async () => {
//             //budget is low
//           await  expect(projects.addProject(PROJECTHASHID,"1000" )).to.revertedWith("Projects__budgetAmountIsLow()")

//         })
//         it("should emit add project event added", async () => {

//       await expect(projects.addProject(PROJECTHASHID, BUDGET)).to.emit(projects,"ProjectAdded")

//         })

//         it("event data ",async ()=>{
//             const tx =     await projects.addProject(PROJECTHASHID, BUDGET)
//             const txRecipe =await tx.wait(1)
//             const authorFromContract =  txRecipe!.events![0].args!.author
//             const projectHashIdFromContract = txRecipe!.events![0].args!.projectHashId
//             assert.equal(authorFromContract,deployer)
//             assert.equal(projectHashIdFromContract,PROJECTHASHID)
//         })
//     })
// })
