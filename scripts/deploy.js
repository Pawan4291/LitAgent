const { ethers } = require('hardhat');

async function main() {
  const LitScheduler = await ethers.getContractFactory('LitScheduler');
  const contract = await LitScheduler.deploy();
  await contract.waitForDeployment();
  console.log('LitScheduler deployed to:', await contract.getAddress());
}

main().catch(console.error);