//Third Party
import { assert, expect } from "chai"
import { ethers, getNamedAccounts, deployments } from "hardhat"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

//App
import {Projects} from '../../typechain-types/Projects'

describe("Projects", function () {
    let projects:Projects, deployer: string
    this.beforeEach(async () => {
         deployer  = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        projects = await ethers.getContract("Projects", deployer)
    })

    describe("add project", () => {
        it("add author to authors array", async () => {
            const projectHashId = ethers.utils.formatBytes32String("salam")
            console.log(projectHashId)
            const budget = ethers.utils.parseEther("2")
            const transactionResponse = await projects.addProject(
                projectHashId,
                3
            )
            // const transactionRecipe = transactionResponse.wait(1)
            const authorFromContract = await projects.getAuthor(0)
            console.log(`author from contract ${authorFromContract}`)
            assert.equal(deployer,authorFromContract)
        })

        it("")
    })
})
