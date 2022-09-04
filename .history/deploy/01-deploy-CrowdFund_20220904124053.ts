import { getNamedAccounts, deployments, network, run } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

//App
import {VERIFICATION_BLOCK_CONFIRMATIONS,developmentChains} from '../helper.hardhat.config'



export const MINIMUM_FUND_AMOUNT = 100000000000000 //0.0001 ETH
export const MINIMUM_GOAL_AMOUNT= 1000000000000000 //0.001 ETH

const deployCrowdFund: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const CrowdFund = await deploy("CrowdFund", {
        from: deployer,
        args: [MINIMUM_GOAL_AMOUNT,MINIMUM_FUND_AMOUNT],
        log: true,
        waitConfirmations: VERIFICATION_BLOCK_CONFIRMATIONS,
    })
    log("Crowd Fund Deployed To: " + CrowdFund.address)

    
}
export default deployCrowdFund
deployCrowdFund.tags = ["all", "CrowdFund"]
