import { getNamedAccounts, deployments, network, run } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

export const MINIMUUM_FUND_AMOUNT = "1000000000000000000000"
export const MINIMUM_BUDGET= 0.1 //eth

const deployProjects: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const projects = await deploy("Projects", {
        from: deployer,
        args: [MINIMUUM_FUND_AMOUNT,MINIMUUM],
        log: true,
        waitConfirmations: 1,
    })
}
export default deployProjects
deployProjects.tags = ["all", "Projects"]
