const { ethers } = require('ethers');
require('dotenv').config();
const provider = new ethers.JsonRpcProvider('https://liteforge.rpc.caldera.xyz/http');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const CONTRACT = '0xA4Cf50f8B85e4C4d0459F6CBE11D6D51568B89D7';
const ABI = [
  "function execute(address owner, uint256 jobId) external",
  "function getJobs(address owner) view returns (tuple(address to, uint256 amount, uint256 nextRun, uint256 interval, uint256 maxCycles, uint256 executedCycles, bool active, string label)[])"
];

const WATCHED_WALLETS = [
  '0xe164c2e603c3698d2eda9c456f640a5880a0eaff' // your wallet
];

async function run() {
  const contract = new ethers.Contract(CONTRACT, ABI, wallet);
  
  for (const owner of WATCHED_WALLETS) {
    try {
      const jobs = await contract.getJobs(owner);
      const now = Math.floor(Date.now() / 1000);
      
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        if (job.active && BigInt(now) >= job.nextRun) {
          console.log(`Executing job ${i} for ${owner}`);
          const tx = await contract.execute(owner, i, { gasLimit: 200000n });
          await tx.wait();
          console.log(`✅ Job ${i} executed: ${tx.hash}`);
        }
      }
    } catch (e) {
      console.error(`Error for ${owner}:`, e.message);
    }
  }
}

// Run every 30 seconds
run();
setInterval(run, 30000);
console.log('🤖 Executor running...');