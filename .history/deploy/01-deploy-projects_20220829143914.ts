import { getNamedAccounts, deployments, network, run } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

// export const MINIMUM_FUND_AMOUNT = "1000000000000000000000"
// export const MINIMUM_BUDGET= "1000000000000000000000000"

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const CrowdFund = await deploy("CrowdFund", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
    })
}
export default deploy
deploy.tags = ["all", "Projects"]
