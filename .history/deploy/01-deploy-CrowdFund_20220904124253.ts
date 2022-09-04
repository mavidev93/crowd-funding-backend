import { getNamedAccounts, deployments, network, run } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

//App
import {VERIFICATION_BLOCK_CONFIRMATIONS,developmentChains} from '../helper.hardhat.config'
import {veri}


export const MINIMUM_FUND_AMOUNT = 100000000000000 //0.0001 ETH
export const MINIMUM_GOAL_AMOUNT= 1000000000000000 //0.001 ETH

const deployCrowdFund: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args =[MINIMUM_GOAL_AMOUNT,MINIMUM_FUND_AMOUNT]
    const CrowdFund = await deploy("CrowdFund", {
        from: deployer,
        args ,
        log: true,
        waitConfirmations: VERIFICATION_BLOCK_CONFIRMATIONS,
    })
    log("Crowd Fund Deployed To: " + CrowdFund.address)

        // Verify the deployment
        if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
            log("Verifying...")
            await verify(raffle.address, args)
        }

        log("Run Price Feed contract with command:")
        const networkName = network.name == "hardhat" ? "localhost" : network.name
        log(`yarn hardhat run scripts/enterRaffle.js --network ${networkName}`)
        log("----------------------------------------------------")

}
export default deployCrowdFund
deployCrowdFund.tags = ["all", "CrowdFund"]
