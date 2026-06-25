import { ethers } from 'ethers';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Info, ExternalLink, X, RefreshCw } from 'lucide-react';
import { loadJobs, getDueJobs, markJobRan, ScheduledJob } from '../services/scheduler';
import { sendZkLTC, getOnChainJobs, cancelOnChainJob, withdrawFromContract } from '../services/ethers';
import { useWallet } from '../hooks/useWallet';
import { LITVM_CHAIN } from '../config/litvm';

export default function Automations() {
  const [contractBalance, setContractBalance] = useState('0');
  const [withdrawn, setWithdrawn] = useState(false);
  const wallet = useWallet();
  const [withdrawing, setWithdrawing] = useState(false);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [onChainJobs, setOnChainJobs] = useState<any[]>([]);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [recentRuns, setRecentRuns] = useState<{ id: string; hash: string; success: boolean; ts: number }[]>([]);
const [isRefreshing, setIsRefreshing] = useState(false);
  const refresh = useCallback(() => setJobs(loadJobs()), []);

  const refreshOnChain = useCallback(async () => {
  if (!wallet.account) return;
const j = await getOnChainJobs(wallet.account);
setOnChainJobs(Array.from(j).sort((a: any, b: any) => (b.active ? 1 : 0) - (a.active ? 1 : 0)));
  // Check contract balance
  const provider = new ethers.JsonRpcProvider('https://liteforge.rpc.caldera.xyz/http');
  const bal = await provider.getBalance(import.meta.env.VITE_SCHEDULER_CONTRACT);
  setContractBalance(ethers.formatEther(bal));
}, [wallet.account]);

  

  useEffect(() => {
    refresh();
    refreshOnChain();
    const interval = setInterval(() => {
      refresh();
      refreshOnChain();
    }, 30000);
    return () => clearInterval(interval);
  }, [refresh, refreshOnChain]);

  useEffect(() => {
    const checkAndRun = async () => {
      if (!wallet.isConnected || !wallet.account) return;
      const due = getDueJobs();
      for (const job of due) {
        if (runningJob) continue;
        setRunningJob(job.id);
        try {
          const result = await sendZkLTC(job.to, job.amount);
          markJobRan(job.id);
          setRecentRuns(prev => [{ id: job.id, hash: result.hash, success: result.success, ts: Date.now() }, ...prev.slice(0, 4)]);
          refresh();
        } catch { markJobRan(job.id); }
        finally { setRunningJob(null); }
      }
    };
    checkAndRun();
    const interval = setInterval(checkAndRun, 60000);
    return () => clearInterval(interval);
  }, [wallet.isConnected, wallet.account, runningJob, refresh]);

  const handleCancel = async (jobId: number) => {
    setCancelling(jobId);
    const result = await cancelOnChainJob(jobId);
    if (result.success) await refreshOnChain();
    setCancelling(null);
  };

  

const handleWithdraw = async () => {
  setWithdrawing(true);
  const result = await withdrawFromContract();
  if (result.success) {
    setWithdrawn(true);
    await refreshOnChain();
  }
  setWithdrawing(false);
};

const handleRefresh = async () => {
  setIsRefreshing(true);
  refresh();
  await refreshOnChain();
  setIsRefreshing(false);
};

  const formatTime = (ts: bigint) => new Date(Number(ts) * 1000).toLocaleString();

  const formatInterval = (s: bigint) => {
    const n = Number(s);
    if (n < 3600) return `Every ${n / 60} min`;
    if (n < 86400) return `Every ${n / 3600} hr`;
    if (n < 604800) return `Every ${n / 86400} day`;
    if (n < 2592000) return `Every ${n / 604800} week`;
    return `Every ${n / 2592000} month`;
  };

  const getStatus = (job: any) => {
    if (job.active) return 'ACTIVE';
    if (Number(job.executedCycles) >= Number(job.maxCycles)) return 'COMPLETED';
    return 'CANCELLED';
  };

  const getStatusColor = (job: any) => {
    if (job.active) return 'bg-emerald-500 text-white';
    if (Number(job.executedCycles) >= Number(job.maxCycles)) return 'bg-blue-500 text-white';
    return 'bg-slate-400 text-white';
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 pb-28 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
<div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Automations</h1>
              <p className="text-xs text-slate-500">Scheduled zkLTC transfers</p>
            </div>
          </div>
          <button onClick={handleRefresh} disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <motion.div animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}>
              <RefreshCw className="w-3.5 h-3.5 text-orange-500" />
            </motion.div>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

      {onChainJobs.some(j => !j.active) && (
          parseFloat(contractBalance) > 0 ? (
            <button onClick={handleWithdraw} disabled={withdrawing}
              className="w-full py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
              {withdrawing ? 'Withdrawing...' : `💰 Withdraw ${parseFloat(contractBalance).toFixed(4)} zkLTC`}
            </button>
          ) : (
            <div className="w-full py-3 rounded-2xl bg-slate-100 text-slate-500 font-semibold text-sm text-center">
              ✅ Funds already withdrawn
            </div>
          )
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'On-Chain Jobs', value: onChainJobs.length },
            { label: 'Active', value: onChainJobs.filter(j => j.active).length },
            { label: 'Local Jobs', value: jobs.length },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              className="p-4 rounded-2xl bg-white/80 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-black text-blue-600">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white/80 rounded-3xl border border-slate-100 shadow-xl p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" /> On-Chain Scheduled Jobs
          </h2>
          {onChainJobs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No on-chain jobs yet. Tell LitAgent to schedule a payment.</p>
          ) : (
            <div className="space-y-3">
              {onChainJobs.map((job, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${job.active ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor(job)}`}>
                          {getStatus(job)}
                        </span>
                        <span className="text-xs text-slate-500">Job #{i}</span>
                      </div>
                      {job.label && <p className="text-xs font-medium text-slate-600">{job.label}</p>}
                      <p className="text-sm font-semibold text-slate-700">
                        {Number(job.amount) / 1e18} zkLTC → <span className="font-mono text-xs">{job.to.slice(0, 8)}...{job.to.slice(-4)}</span>
                      </p>
                      <p className="text-xs text-slate-400">
  {Number(job.nextRun) > 0
    ? `Created: ${new Date((Number(job.nextRun) - Number(job.interval)) * 1000).toLocaleString()}`
    : ''}
</p>
                      <p className="text-xs text-purple-600 font-medium">
                        Progress: {Number(job.executedCycles)}/{Number(job.maxCycles)} cycles
                      </p>
                      {job.active && <p className="text-xs text-slate-400">Next run: {formatTime(job.nextRun)}</p>}
                      <a href={`${LITVM_CHAIN.explorerUrl}/address/${import.meta.env.VITE_SCHEDULER_CONTRACT}`}
                        target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                        <ExternalLink className="w-3 h-3" /> View on explorer
                      </a>
                    </div>
                    {job.active && (
                      <button onClick={() => handleCancel(i)} disabled={cancelling === i}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 disabled:opacity-50">
                        <X className="w-3 h-3" />
                        {cancelling === i ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {recentRuns.length > 0 && (
          <div className="p-4 rounded-2xl bg-white/80 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Runs</h3>
            <div className="space-y-2">
              {recentRuns.map(run => (
                <div key={`${run.id}-${run.ts}`} className={`flex items-center justify-between p-2 rounded-xl text-xs ${run.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <span className={run.success ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>{run.success ? '✅ Success' : '❌ Failed'}</span>
                  <span className="text-slate-500">{new Date(run.ts).toLocaleTimeString()}</span>
                  {run.hash && (
                    <a href={`${LITVM_CHAIN.explorerUrl}/tx/${run.hash}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500">
                      <span className="font-mono">{run.hash.slice(0, 8)}...</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

     <div className="flex gap-3 p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-600">On-chain jobs execute automatically. Cancel anytime — remaining funds stay in contract until withdrawn.</p>
        </div>

      </div>
    </div>
  );
}