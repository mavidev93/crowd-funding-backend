//Third Party
import { ethers, network } from "hardhat"
import * as fs from "fs"

//File Locations
const FRONTEND_ADDRESSES_FILE =
    "../FrontEnd/src/constants/contractAddresses.json"
const FRONTEND_ABI_FILE = "../FrontEnd/src/constants/abi.json"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("updating frontEnd...")
        updateContractAddresses()
        updateContractAbi()
    }
    
}

async function updateContractAbi() {
    const crowdFund = await ethers.getContract("CrowdFund")
    fs.writeFileSync(
        FRONTEND_ABI_FILE,
        crowdFund.interface.format(ethers.utils.FormatTypes.json).toString()
    )
}

async function updateContractAddresses() {
    const crowdFund = await ethers.getContract("CrowdFund")
    const chainId = network.config.chainId?.toString()!
    const currentAddresses = JSON.parse(
        fs.readFileSync(FRONTEND_ADDRESSES_FILE, "utf8")
    )
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(crowdFund.address)) {
            currentAddresses[chainId].push(crowdFund.address)
        }
    } else {
        currentAddresses[chainId] = [crowdFund.address]
    }
    fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

module.exports.tags = ["all", "frontend"]
