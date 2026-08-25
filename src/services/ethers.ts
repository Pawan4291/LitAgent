import { ethers } from 'ethers';
import { LITVM_CHAIN, CHAIN_PARAMS } from '../config/litvm';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function getProvider(): ethers.BrowserProvider | null {
  if (!window.ethereum) return null;
  return new ethers.BrowserProvider(window.ethereum);
}

export function getRpcProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(LITVM_CHAIN.rpcUrl);
}

export async function getBalance(address: string): Promise<string> {
  try {
    const provider = getRpcProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Balance fetch error:', error);
    return '0';
  }
}

export async function sendZkLTC(
  to: string,
  amount: string
): Promise<{ hash: string; success: boolean; error?: string }> {
  try {
    if (!window.ethereum) throw new Error('MetaMask not found');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const value = ethers.parseEther(String(amount));
    const gasPrice = await provider.getFeeData();

    const tx = await signer.sendTransaction({
      to,
      value,
     gasLimit: 100000n,
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
    });

    await tx.wait();

    return { hash: tx.hash, success: true };
  } catch (error: any) {
    console.error('Send error:', error);
    return { hash: '', success: false, error: error.message || 'Transaction failed' };
  }
}

export async function estimateGas(_to: string, _amount: string): Promise<string> {
  try {
    const provider = getRpcProvider();
    const feeData = await provider.getFeeData();
    const gasLimit = 21000n;
    const gasPrice = feeData.gasPrice || 0n;
    const estimatedGas = gasLimit * gasPrice;
    return ethers.formatEther(estimatedGas);
  } catch {
    return '0.000021';
  }
}

export async function switchToLitVM(): Promise<boolean> {
  try {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: LITVM_CHAIN.chainId }],
      });
      return true;
    } catch (switchError: any) {
      // Chain not added yet
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: CHAIN_PARAMS,
        });
        return true;
      }
      throw switchError;
    }
  } catch (error) {
    console.error('Network switch error:', error);
    return false;
  }
}

export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export async function getTransactionsByAddress(address: string, count = 20): Promise<any[]> {
  return []; // disabled during dev - stops 429 spam
  try {
    const provider = getRpcProvider();
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 1000);

    // Fetch recent blocks to find transactions
    const txList: any[] = [];
    const batchSize = 10;

    for (let i = latestBlock; i >= fromBlock && txList.length < count; i -= batchSize) {
      const blockPromises = [];
      for (let j = i; j > i - batchSize && j >= fromBlock; j--) {
        blockPromises.push(provider.getBlock(j, true));
      }
      const blocks = await Promise.all(blockPromises);

      for (const block of blocks) {
        if (!block || !block.transactions) continue;
        for (const tx of block.transactions as any[]) {
          if (
            tx.from?.toLowerCase() === address.toLowerCase() ||
            tx.to?.toLowerCase() === address.toLowerCase()
          ) {
            txList.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: ethers.formatEther(tx.value || 0n),
              timestamp: block.timestamp,
              blockNumber: block.number,
            });
            if (txList.length >= count) break;
          }
        }
        if (txList.length >= count) break;
      }
    }

    return txList;
  } catch (error) {
    console.error('TX history error:', error);
    return [];
  }
}
const SCHEDULER_ABI = [
  "function createJob(address _to, uint256 _interval, uint256 _maxCycles, string calldata _label) payable",
  "function execute(address owner, uint256 jobId) external",
  "function cancelJob(uint256 jobId) external",
  "function withdraw() external",
  "function getJobs(address owner) view returns (tuple(address to, uint256 amount, uint256 nextRun, uint256 interval, uint256 maxCycles, uint256 executedCycles, bool active, string label)[])",
  "function getHistory(address owner) view returns (tuple(uint256 jobId, uint256 timestamp, uint256 amount, address to, bool success)[])"
];

export async function createOnChainJob(
  toAddress: string,
  intervalSeconds: number,
  amountEth: string,
  maxCycles: number,
  label: string
): Promise<{ hash: string; success: boolean; error?: string }> {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];

    const iface = new ethers.Interface([
      "function createJob(address _to, uint256 _interval, uint256 _maxCycles, string _label) payable"
    ]);
    const checksummedAddress = ethers.getAddress(toAddress);
    const data = iface.encodeFunctionData('createJob', [
  toAddress, 
      BigInt(intervalSeconds),
      BigInt(maxCycles),
      label
    ]);

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: import.meta.env.VITE_SCHEDULER_CONTRACT,
        data,
        value: '0x' + ethers.parseEther(amountEth).toString(16),
        gas: '0x' + (400000).toString(16)
      }]
    });

    return { hash: txHash, success: true };
  } catch (error: any) {
    return { hash: '', success: false, error: error.message };
  }
}

export async function getOnChainJobs(ownerAddress: string): Promise<any[]> {
  try {
    const provider = getRpcProvider();
    const contract = new ethers.Contract(
      import.meta.env.VITE_SCHEDULER_CONTRACT,
      SCHEDULER_ABI,
      provider
    );
    return await contract.getJobs(ownerAddress);
  } catch {
    return [];
  }
}
export async function cancelOnChainJob(
  jobId: number
): Promise<{ hash: string; success: boolean; error?: string }> {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];

    const iface = new ethers.Interface([
      "function cancelJob(uint256 jobId)"
    ]);
    const data = iface.encodeFunctionData('cancelJob', [BigInt(jobId)]);

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: import.meta.env.VITE_SCHEDULER_CONTRACT, data, gas: '0x30000' }]
    });

    return { hash: txHash, success: true };
  } catch (error: any) {
    return { hash: '', success: false, error: error.message };
  }
}
export async function withdrawFromContract(): Promise<{ hash: string; success: boolean; error?: string }> {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];
    const iface = new ethers.Interface(["function withdraw() external"]);
    const data = iface.encodeFunctionData('withdraw', []);
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: import.meta.env.VITE_SCHEDULER_CONTRACT, data, gas: '0x30000' }]
    });
    return { hash: txHash, success: true };
  } catch (error: any) {
    return { hash: '', success: false, error: error.message };
  }
}

export async function getOnChainHistory(ownerAddress: string): Promise<any[]> {
  try {
    const provider = getRpcProvider();
    const contract = new ethers.Contract(
      import.meta.env.VITE_SCHEDULER_CONTRACT,
      SCHEDULER_ABI,
      provider
    );
    return await contract.getHistory(ownerAddress);
  } catch {
    return [];
  }
}
const BULKPAYOUT_ABI = [
  "function bulkSend(address[] _recipients, uint256[] _amounts, string _label) payable",
  "function getHistory(address sender) view returns (tuple(uint256 payoutId, uint256 timestamp, address[] recipients, uint256[] amounts, string label)[])"
];

export async function bulkSend(
  recipients: string[],
  amounts: string[],
  label: string
): Promise<{ hash: string; success: boolean; error?: string }> {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];

    const amountsWei = amounts.map(a => ethers.parseEther(a));
    const total = amountsWei.reduce((sum, a) => sum + a, 0n);

    const iface = new ethers.Interface([
      "function bulkSend(address[] _recipients, uint256[] _amounts, string _label) payable"
    ]);
    const data = iface.encodeFunctionData('bulkSend', [recipients, amountsWei, label]);

    const provider = getRpcProvider();
    const feeData = await provider.getFeeData();
    const baseFee = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
    const maxFeePerGas = baseFee * 2n;
    const maxPriorityFeePerGas = baseFee;

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: import.meta.env.VITE_BULKPAYOUT_CONTRACT,
        data,
        value: '0x' + total.toString(16),
        gas: '0x' + (200000 + recipients.length * 60000).toString(16),
        maxFeePerGas: '0x' + maxFeePerGas.toString(16),
        maxPriorityFeePerGas: '0x' + maxPriorityFeePerGas.toString(16)
      }]
    });

    return { hash: txHash, success: true };
  } catch (error: any) {
    return { hash: '', success: false, error: error.message };
  }
}

export async function getBulkHistory(ownerAddress: string): Promise<any[]> {
  try {
    const provider = getRpcProvider();
    const contract = new ethers.Contract(
      import.meta.env.VITE_BULKPAYOUT_CONTRACT,
      BULKPAYOUT_ABI,
      provider
    );
    return await contract.getHistory(ownerAddress);
  } catch {
    return [];
  }
}

const ESCROW_ABI = [
  "function createEscrow(address _seller, uint256 _deadlineSeconds, string _label) payable returns (uint256)",
  "function release(uint256 _escrowId) external",
  "function refund(uint256 _escrowId) external",
  "function getBuyerEscrows(address _buyer) view returns (tuple(address buyer, address seller, uint256 amount, uint256 deadline, string label, uint8 status)[])",
  "function getSellerEscrows(address _seller) view returns (tuple(address buyer, address seller, uint256 amount, uint256 deadline, string label, uint8 status)[])"
];

export async function createEscrow(
  seller: string,
  amountEth: string,
  deadlineSeconds: number,
  label: string
): Promise<{ hash: string; success: boolean; error?: string }> {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];

    const iface = new ethers.Interface([
      "function createEscrow(address _seller, uint256 _deadlineSeconds, string _label) payable"
    ]);
    const data = iface.encodeFunctionData('createEscrow', [seller, BigInt(deadlineSeconds), label]);

    const provider = getRpcProvider();
    const feeData = await provider.getFeeData();
    const baseFee = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: import.meta.env.VITE_ESCROW_CONTRACT,
        data,
        value: '0x' + ethers.parseEther(amountEth).toString(16),
        gas: '0x' + (250000).toString(16),
        maxFeePerGas: '0x' + (baseFee * 2n).toString(16),
        maxPriorityFeePerGas: '0x' + baseFee.toString(16)
      }]
    });

    return { hash: txHash, success: true };
  } catch (error: any) {
    return { hash: '', success: false, error: error.message };
  }
}

async function getFreshFees() {
  const provider = getRpcProvider();
  const feeData = await provider.getFeeData();
  const baseFee = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
  return { maxFeePerGas: baseFee * 2n, maxPriorityFeePerGas: baseFee };
}

export async function releaseEscrow(escrowId: number): Promise<{ hash: string; success: boolean; error?: string }> {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];
    const iface = new ethers.Interface(["function release(uint256 _escrowId) external"]);
    const data = iface.encodeFunctionData('release', [BigInt(escrowId)]);
    const fees = await getFreshFees();
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from, to: import.meta.env.VITE_ESCROW_CONTRACT, data, gas: '0x30000',
        maxFeePerGas: '0x' + fees.maxFeePerGas.toString(16),
        maxPriorityFeePerGas: '0x' + fees.maxPriorityFeePerGas.toString(16)
      }]
    });
    return { hash: txHash, success: true };
  } catch (error: any) {
    return { hash: '', success: false, error: error.message };
  }
}

export async function refundEscrow(escrowId: number): Promise<{ hash: string; success: boolean; error?: string }> {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];
    const iface = new ethers.Interface(["function refund(uint256 _escrowId) external"]);
    const data = iface.encodeFunctionData('refund', [BigInt(escrowId)]);
    const fees = await getFreshFees();
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from, to: import.meta.env.VITE_ESCROW_CONTRACT, data, gas: '0x30000',
        maxFeePerGas: '0x' + fees.maxFeePerGas.toString(16),
        maxPriorityFeePerGas: '0x' + fees.maxPriorityFeePerGas.toString(16)
      }]
    });
    return { hash: txHash, success: true };
  } catch (error: any) {
    return { hash: '', success: false, error: error.message };
  }
}

export async function getBuyerEscrows(address: string): Promise<any[]> {
  try {
    const provider = getRpcProvider();
    const contract = new ethers.Contract(import.meta.env.VITE_ESCROW_CONTRACT, ESCROW_ABI, provider);
    return await contract.getBuyerEscrows(address);
  } catch {
    return [];
  }
}

export async function getSellerEscrows(address: string): Promise<any[]> {
  try {
    const provider = getRpcProvider();
    const contract = new ethers.Contract(import.meta.env.VITE_ESCROW_CONTRACT, ESCROW_ABI, provider);
    return await contract.getSellerEscrows(address);
  } catch {
    return [];
  }
}

export async function registerWallet(address: string): Promise<void> {
  try {
    await fetch(`${import.meta.env.VITE_EXECUTOR_API}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });
  } catch (e) {
    console.error('Register wallet error:', e);
  }
}