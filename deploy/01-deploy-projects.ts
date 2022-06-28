import { getNamedAccounts, deployments, network, run } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const deployProjects: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const projects = await deploy("Projects", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
    })
}
export default deployProjects
deployProjects.tags = ["all", "Projects"]
