//Third Party
import { assert, expect } from "chai"
import { ethers, getNamedAccounts, deployments } from "hardhat"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

//App
import { Projects } from "../../typechain-types/Projects"
import {MINIMUM_BUDGET,MINIMUM_FUND_AMOUNT} from '../../deploy/01-deploy-projects'
//types
type address = string;


//CONSTANTES
const BUDGET = ethers.utils.parseEther("2")
const PROJECTHASHID = ethers.utils.id("salam")

describe("Projects", function () {
    let projects: Projects, deployer: address, funder:address
    this.beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        funder = (await getNamedAccounts()).funder
        console.log(`funder is: ${funder}`)
        await deployments.fixture(["all"])
        projects = await ethers.getContract("Projects", deployer)
    })

    describe("add project", () => {
        it("add author to authors array", async () => {
            const transactionResponse = await projects.addProject(
                PROJECTHASHID,
                BUDGET
            )
            // const transactionRecipe = transactionResponse.wait(1)
            const authorFromContract = await projects.getAuthor(0)
            assert.equal(deployer, authorFromContract)
        })

        it("revert when budget is low than minimum", async () => {
          await  expect(projects.addProject(PROJECTHASHID,MINIMUM_BUDGET ))

        })
        it("should emit add project event added", async () => {

      await expect(projects.addProject(PROJECTHASHID, BUDGET)).to.emit(projects,"ProjectAdded")

        })

        it("event data ",async ()=>{
            const tx =     await projects.addProject(PROJECTHASHID, BUDGET)
            const txRecipe =await tx.wait(1)
            const authorFromContract =  txRecipe!.events![0].args!.author
            const projectHashIdFromContract = txRecipe!.events![0].args!.projectHashId
            assert.equal(authorFromContract,deployer)
            assert.equal(projectHashIdFromContract,PROJECTHASHID)
        })
    })
})
