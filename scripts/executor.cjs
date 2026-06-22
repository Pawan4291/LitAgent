const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider('https://liteforge.rpc.caldera.xyz/http');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const CONTRACT = '0xA4Cf50f8B85e4C4d0459F6CBE11D6D51568B89D7';
const ABI = [
  "function execute(address owner, uint256 jobId) external",
  "function getJobs(address owner) view returns (tuple(address to, uint256 amount, uint256 nextRun, uint256 interval, uint256 maxCycles, uint256 executedCycles, bool active, string label)[])",
  "event JobCreated(address indexed owner, uint256 jobId, address to, uint256 amount, uint256 interval, uint256 maxCycles)"
];

const contract = new ethers.Contract(CONTRACT, ABI, wallet);
const knownOwners = new Set();

async function discoverOwners() {
  try {
    const filter = contract.filters.JobCreated();
    const events = await contract.queryFilter(filter, 0, 'latest');
    events.forEach(e => knownOwners.add(e.args.owner));
    console.log(`👥 Tracking ${knownOwners.size} wallets`);
  } catch (e) {
    console.error('Discover error:', e.message);
  }
}

async function run() {
  await discoverOwners(); // ← move here, runs every 30 sec
  const now = Math.floor(Date.now() / 1000);

  for (const owner of knownOwners) {
    try {
      const jobs = await contract.getJobs(owner);
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

run();
setInterval(run, 30000);
console.log('🤖 Executor running — watching all wallets...');