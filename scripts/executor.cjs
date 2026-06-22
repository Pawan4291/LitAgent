const { ethers } = require('ethers');
require('dotenv').config();

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function getWallets() {
  const res = await fetch(`${UPSTASH_URL}/smembers/wallets`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
  });
  const data = await res.json();
  return data.result || [];
}

const provider = new ethers.JsonRpcProvider('https://liteforge.rpc.caldera.xyz/http');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const CONTRACT = '0xA4Cf50f8B85e4C4d0459F6CBE11D6D51568B89D7';
const ABI = [
  "function execute(address owner, uint256 jobId) external",
  "function getJobs(address owner) view returns (tuple(address to, uint256 amount, uint256 nextRun, uint256 interval, uint256 maxCycles, uint256 executedCycles, bool active, string label)[])"
];

const contract = new ethers.Contract(CONTRACT, ABI, wallet);

async function run() {
  const wallets = await getWallets();
  console.log(`👥 Checking ${wallets.length} wallets`);
  const now = Math.floor(Date.now() / 1000);

  for (const owner of wallets) {
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
console.log('🤖 Executor running...');