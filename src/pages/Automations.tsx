import { ethers } from 'ethers';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Info, ExternalLink, X, RefreshCw } from 'lucide-react';
import { loadJobs, getDueJobs, markJobRan, ScheduledJob } from '../services/scheduler';
import { sendZkLTC, getOnChainJobs, cancelOnChainJob, withdrawFromContract } from '../services/ethers';
import { useWallet } from '../hooks/useWallet';
import { LITVM_CHAIN } from '../config/litvm';
import { BellRing, Zap as ZapIcon } from 'lucide-react';
import { getReminders, deleteReminder, markReminderPaid, ReminderRecord } from '../services/reminders';
import { ShieldCheck } from 'lucide-react';
import { getBuyerEscrows, releaseEscrow, refundEscrow } from '../services/ethers';

export default function Automations() {
  const [contractBalance, setContractBalance] = useState('0');
  const wallet = useWallet();
  const [withdrawing, setWithdrawing] = useState(false);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [onChainJobs, setOnChainJobs] = useState<{job: any, originalIndex: number}[]>([]);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [recentRuns, setRecentRuns] = useState<{ id: string; hash: string; success: boolean; ts: number }[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [justPaidId, setJustPaidId] = useState<string | null>(null);
  const [tab, setTab] = useState<'schedule' | 'reminders' | 'escrow'>('schedule');
  const [escrows, setEscrows] = useState<any[]>([]);
  const [escrowActionId, setEscrowActionId] = useState<number | null>(null);

  const refreshEscrows = useCallback(() => {
    if (wallet.account) getBuyerEscrows(wallet.account).then((records) => setEscrows([...records].reverse()));
  }, [wallet.account]);

  useEffect(() => { refreshEscrows(); }, [refreshEscrows]);

  const handleRelease = async (id: number) => {
    if (!window.confirm('Confirm you received what you paid for? This releases funds to the seller.')) return;
    setEscrowActionId(id);
    try {
      const result = await releaseEscrow(id);
      if (result.success) { await new Promise(r => setTimeout(r, 2000)); refreshEscrows(); }
    } finally { setEscrowActionId(null); }
  };

  const handleRefund = async (id: number) => {
    if (!window.confirm('Reclaim these funds back to your wallet?')) return;
    setEscrowActionId(id);
    try {
      const result = await refundEscrow(id);
      if (result.success) { await new Promise(r => setTimeout(r, 2000)); refreshEscrows(); wallet.refreshBalance(); }
    } finally { setEscrowActionId(null); }
  };

  const refreshReminders = useCallback(() => {
    if (wallet.account) getReminders(wallet.account).then((r) => setReminders(r.filter(x => x.active)));
  }, [wallet.account]);

  useEffect(() => { refreshReminders(); }, [refreshReminders]);

  const handleDeleteReminder = async (id: string) => {
    if (!wallet.account) return;
    if (!window.confirm('Cancel this reminder permanently?')) return;
    await deleteReminder(wallet.account, id);
    refreshReminders();
  };

  const handlePayReminder = async (r: ReminderRecord) => {
    if (!wallet.account || !r.to || !r.amount) return;
    if (!window.confirm(`Send ${r.amount} zkLTC to ${r.to.slice(0,8)}...?`)) return;
    setPayingId(r.id);
    try {
      const result = await sendZkLTC(r.to, r.amount);
      if (result.success) {
        await markReminderPaid(wallet.account, r.id);
        setJustPaidId(r.id);
        setTimeout(() => refreshReminders(), 1500);
      }
    } finally {
      setPayingId(null);
    }
  };

  const refresh = useCallback(() => setJobs(loadJobs()), []);

  const refreshOnChain = useCallback(async () => {
    if (!wallet.account) return;
    try {
      const j = await getOnChainJobs(wallet.account);
      const withIndex = Array.from(j).map((job: any, i: number) => ({ job, originalIndex: i }));
      withIndex.sort((a: any, b: any) => (b.job.active ? 1 : 0) - (a.job.active ? 1 : 0));
      setOnChainJobs(withIndex);
      const provider = new ethers.JsonRpcProvider('https://liteforge.rpc.caldera.xyz/http');
      const bal = await provider.getBalance(import.meta.env.VITE_SCHEDULER_CONTRACT);
      setContractBalance(ethers.formatEther(bal));
    } catch (e) {
      console.error('refreshOnChain error:', e);
    }
  }, [wallet.account]);

  useEffect(() => {
    refresh();
    refreshOnChain();
    const interval = setInterval(() => { refresh(); refreshOnChain(); }, 30000);
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

 const handleCancel = async (originalIndex: number) => {
    try {
      setCancelling(originalIndex);
      const result = await cancelOnChainJob(originalIndex);
      if (result.success) {
        setOnChainJobs(prev => prev.map(item =>
          item.originalIndex === originalIndex
            ? { ...item, job: { ...item.job, active: false } }
            : item
        ));
        await refreshOnChain();
      } else {
        console.error('Cancel failed:', result.error);
      }
    } catch (e: any) {
      console.error('handleCancel error:', e);
    } finally {
      setCancelling(null);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const result = await withdrawFromContract();
      if (result.success) {
        setContractBalance('0');
        await new Promise(r => setTimeout(r, 3000));
        await refreshOnChain();
      }
    } catch (e) { console.error(e); }
    finally { setWithdrawing(false); }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    await refreshOnChain();
    setIsRefreshing(false);
  };

 const formatTime = (ts: any) => {
  try { return new Date(Number(ts) * 1000).toLocaleString(); } catch { return '—'; }
};

const formatInterval = (s: any) => {
  try {
    const n = Number(s);
    if (!n || isNaN(n)) return '—';
    if (n < 3600) return `Every ${n / 60} min`;
    if (n < 86400) return `Every ${n / 3600} hr`;
    if (n < 604800) return `Every ${n / 86400} day`;
    if (n < 2592000) return `Every ${n / 604800} week`;
    return `Every ${n / 2592000} month`;
  } catch { return '—'; }
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

  const hasInactiveJobs = onChainJobs.some(item => !item.job.active);

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

        <div className="flex gap-1 p-1 bg-slate-100/80 rounded-2xl">
          {(['schedule', 'reminders', 'escrow'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === t ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500'}`}>
              {t === 'schedule' ? <><ZapIcon className="w-4 h-4" />Schedule</> : t === 'reminders' ? <><BellRing className="w-4 h-4" />Reminders</> : <><ShieldCheck className="w-4 h-4" />Escrow</>}
            </button>
          ))}
        </div>

        {tab === 'schedule' && hasInactiveJobs && (
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

        {tab === 'schedule' && <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'On-Chain Jobs', value: onChainJobs.length },
            { label: 'Active', value: onChainJobs.filter(item => item.job.active).length },
            { label: 'Local Jobs', value: jobs.length },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              className="p-4 rounded-2xl bg-white/80 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-black text-blue-600">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>}

        {tab === 'schedule' && <div className="bg-white/80 rounded-3xl border border-slate-100 shadow-xl p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" /> On-Chain Scheduled Jobs
          </h2>
          {onChainJobs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No on-chain jobs yet. Tell LitAgent to schedule a payment.</p>
          ) : (
            <div className="space-y-3">
             {onChainJobs.filter(({ job }) => job != null && job.to).map(({ job, originalIndex }) => (
                <div key={originalIndex} className={`p-4 rounded-2xl border ${job.active ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor(job)}`}>
                          {getStatus(job)}
                        </span>
                        <span className="text-xs text-slate-500">Job #{originalIndex}</span>
                      </div>
                      {job.label && <p className="text-xs font-medium text-slate-600">{job.label}</p>}
                      <p className="text-sm font-semibold text-slate-700">
                        {Number(job.amount) / 1e18} zkLTC → <span className="font-mono text-xs">{job.to.slice(0, 8)}...{job.to.slice(-4)}</span>
                      </p>
                      <p className="text-xs text-slate-500">{formatInterval(job.interval)}</p>
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
                      <button onClick={() => handleCancel(originalIndex)} disabled={cancelling === originalIndex}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 disabled:opacity-50">
                        <X className="w-3 h-3" />
                        {cancelling === originalIndex ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}

        {tab === 'schedule' && recentRuns.length > 0 && (
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

        {tab === 'schedule' && <div className="flex gap-3 p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-600">On-chain jobs execute automatically. Cancel anytime — remaining funds stay in contract until withdrawn.</p>
        </div>}

        {tab === 'reminders' && <div className="bg-white/80 rounded-3xl border border-slate-100 shadow-xl p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-pink-500" /> Payment Reminders
          </h2>
          {reminders.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No active reminders. Ask LitAgent to remind you about something.</p>
          ) : (
            <div className="space-y-3">
              {reminders.map((r) => (
                <div key={r.id} className={`p-4 rounded-2xl border flex items-start justify-between transition-colors ${justPaidId === r.id ? 'bg-emerald-50 border-emerald-300' : 'bg-pink-50 border-pink-200'}`}>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">{r.label}</p>
                    {(r.amount || r.to) && (
                      <p className="text-xs text-slate-500">
                        {r.amount ? `${r.amount} zkLTC` : ''}{r.amount && r.to ? ' → ' : ''}{r.to ? `${r.to.slice(0,8)}...${r.to.slice(-4)}` : ''}
                      </p>
                    )}
                    <p className={`text-xs font-medium ${justPaidId === r.id ? 'text-emerald-600' : 'text-pink-600'}`}>
                      {justPaidId === r.id ? '✅ Paid!' : `Next: ${new Date(r.nextDue).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {r.to && r.amount && justPaidId !== r.id && (
                      <button onClick={() => handlePayReminder(r)} disabled={payingId === r.id || r.nextDue > Date.now()}
                        title={r.nextDue > Date.now() ? `Available at ${new Date(r.nextDue).toLocaleTimeString()}` : ''}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed">
                        {payingId === r.id ? 'Sending...' : r.nextDue > Date.now() ? 'Not due yet' : 'Pay Now'}
                      </button>
                    )}
                    {justPaidId !== r.id && (
                      <button onClick={() => handleDeleteReminder(r.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200">
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}

        {tab === 'escrow' && <div className="bg-white/80 rounded-3xl border border-slate-100 shadow-xl p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" /> Escrow Payments
          </h2>
          {escrows.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No escrows yet. Ask LitAgent to lock funds in escrow.</p>
          ) : (
            <div className="space-y-3">
              {escrows.map((e, displayIndex) => {
                const id = escrows.length - 1 - displayIndex;
                const statusLabel = ['Pending', 'Released', 'Refunded'][Number(e.status)];
                const isPending = Number(e.status) === 0;
                const canRefund = isPending && Number(e.deadline) * 1000 <= Date.now();
                return (
                  <div key={id} className={`p-4 rounded-2xl border ${isPending ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200 opacity-70'}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPending ? 'bg-amber-500 text-white' : Number(e.status) === 1 ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-600">{e.label}</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {(Number(e.amount) / 1e18)} zkLTC → <span className="font-mono text-xs">{e.seller.slice(0, 8)}...{e.seller.slice(-4)}</span>
                        </p>
                        {isPending && (
                          <p className="text-xs text-slate-400">
                            {canRefund ? 'Refundable now' : `Refundable after: ${new Date(Number(e.deadline) * 1000).toLocaleString()}`}
                          </p>
                        )}
                      </div>
                      {isPending && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button onClick={() => handleRelease(id)} disabled={escrowActionId === id}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50">
                            Release Funds
                          </button>
                          <button onClick={() => handleRefund(id)} disabled={escrowActionId === id || !canRefund}
                            className="px-3 py-1.5 rounded-xl bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            Refund
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>}

      </div>
    </div>
  );
}