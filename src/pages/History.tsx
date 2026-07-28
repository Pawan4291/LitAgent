import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Sparkles, Download, ExternalLink, Users, Copy, Send } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { getOnChainHistory } from '../services/ethers';
import { generateSpendingStats } from '../services/claude';
import { LITVM_CHAIN } from '../config/litvm';
import { getSplitsByCreator, SplitRequestRecord } from '../services/splitRequest';
import { getBulkHistory } from '../services/ethers';

export default function History() {
  const wallet = useWallet();
  const initialTab = new URLSearchParams(window.location.search).get('tab') === 'splits' ? 'splits' : 'history';
  const [tab, setTab] = useState<'history' | 'stats' | 'splits' | 'bulk'>(initialTab as any);
  const [history, setHistory] = useState<any[]>([]);
  const [splits, setSplits] = useState<SplitRequestRecord[]>([]);
  const [bulkPayouts, setBulkPayouts] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => {
    if (!wallet.account) return;
    setIsLoading(true);
    getOnChainHistory(wallet.account).then(h => {
      setHistory(Array.from(h));
      setIsLoading(false);
    });
  }, [wallet.account]);

  useEffect(() => {
    if (!wallet.account) return;
    getSplitsByCreator(wallet.account).then((records) => {
      setSplits([...records].sort((a, b) => b.createdAt - a.createdAt));
    });
    getBulkHistory(wallet.account).then((records) => {
      setBulkPayouts([...records].reverse());
    });
  }, [wallet.account]);

  const copySplitLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/split/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const bulkEntries = bulkPayouts.flatMap((p) =>
    p.recipients.map((addr: string, i: number) => ({
      type: 'bulk' as const,
      amount: (Number(p.amounts[i]) / 1e18).toString(),
      token: 'zkLTC',
      address: addr,
      hash: '',
      timestamp: Number(p.timestamp),
      description: p.label || 'Bulk Payout',
    }))
  );

  const splitPayments = splits.flatMap((s) =>
    s.recipients
      .filter((r) => r.paid && r.txHash)
      .map((r) => ({
        type: 'split' as const,
        amount: r.amount,
        token: s.token,
        address: r.address,
        hash: r.txHash as string,
        timestamp: Math.floor(s.createdAt / 1000),
        description: s.description,
      }))
  );

  const combinedHistory = [
    ...history.map((h) => ({
      type: 'schedule' as const,
      jobId: Number(h.jobId),
      amount: Number(h.amount) / 1e18,
      to: h.to,
      timestamp: Number(h.timestamp),
    })),
    ...splitPayments,
    ...bulkEntries,
  ].sort((a, b) => b.timestamp - a.timestamp);

 const handleAISummary = async () => {
  if (!wallet.account) return;
  setIsLoadingSummary(true);
  const formatted = history.map(h => ({
    value: (Number(h.amount) / 1e18).toString(),
    from: import.meta.env.VITE_SCHEDULER_CONTRACT,
    to: h.to,
    timestamp: Number(h.timestamp)
  }));
  const summary = await generateSpendingStats(formatted, '', wallet.account);
  setAiSummary(summary);
  setIsLoadingSummary(false);
};

  const exportCSV = () => {
    if (!history.length) return;
    const header = 'JobId,To,Amount,Timestamp,Success\n';
    const rows = history.map(h =>
      `${h.jobId},${h.to},${Number(h.amount)/1e18},${new Date(Number(h.timestamp)*1000).toISOString()},${h.success}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `litagent-history.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 pb-28 md:pb-8">
      <div className="max-w-3xl mx-auto">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <HistoryIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Transaction History</h1>
              <p className="text-xs text-slate-500">On-chain execution log</p>
            </div>
          </div>
          {history.length > 0 && (
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 border border-slate-200 text-slate-600 text-xs font-medium hover:text-blue-600">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </motion.div>

        <div className="flex gap-1 p-1 bg-slate-100/80 rounded-2xl mb-6">
          {(['history', 'splits', 'bulk', 'stats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === t ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500'}`}>
              {t === 'history' ? <><HistoryIcon className="w-4 h-4" />Transactions</> : t === 'splits' ? <><Users className="w-4 h-4" />Splits</> : t === 'bulk' ? <><Send className="w-4 h-4" />Bulk</> : <><Sparkles className="w-4 h-4" />Analytics</>}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-xl p-5">

          {tab === 'splits' ? (
            splits.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm">No split requests created yet.</p>
                <p className="text-slate-400 text-xs mt-1">Ask LitAgent to split a payment to see it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-semibold mb-2">{splits.length} SPLIT REQUESTS</p>
                {splits.map((s) => (
                  <div key={s.id} className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-700">{s.description}</p>
                      <button onClick={() => copySplitLink(s.id)} className="text-blue-500 flex items-center gap-1 text-xs font-medium">
                        <Copy className="w-3.5 h-3.5" /> {copiedId === s.id ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {s.recipients.map((r) => (
                        <div key={r.address} className="flex justify-between text-xs">
                          <span className="font-mono text-slate-500">{r.address.slice(0,8)}...{r.address.slice(-4)}</span>
                          <span className="font-semibold text-slate-600">{r.amount} {s.token} · <span className={r.paid ? 'text-emerald-600' : 'text-amber-500'}>{r.paid ? 'Paid' : 'Pending'}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : tab === 'bulk' ? (
            bulkPayouts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm">No bulk payouts sent yet.</p>
                <p className="text-slate-400 text-xs mt-1">Ask LitAgent to bulk send to see it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-semibold mb-2">{bulkPayouts.length} BULK PAYOUTS</p>
                {bulkPayouts.map((p, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-teal-50 border border-teal-100">
                    <p className="text-sm font-semibold text-slate-700 mb-2">{p.label || 'Bulk Payout'}</p>
                    <div className="space-y-1">
                      {p.recipients.map((addr: string, j: number) => (
                        <div key={addr} className="flex justify-between text-xs">
                          <span className="font-mono text-slate-500">{addr.slice(0,8)}...{addr.slice(-4)}</span>
                          <span className="font-semibold text-slate-600">{(Number(p.amounts[j]) / 1e18)} zkLTC</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{new Date(Number(p.timestamp) * 1000).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )
          ) : tab === 'history' ? (
            isLoading ? (
              <p className="text-center text-slate-400 py-10">Loading...</p>
            ) : combinedHistory.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm">No on-chain executions yet.</p>
                <p className="text-slate-400 text-xs mt-1">Schedule a payment to see history here.</p>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-500 font-semibold mb-2">{combinedHistory.length} EXECUTIONS</p>
                {combinedHistory.map((h, i) => (
                  <div key={i} className={`relative p-3 rounded-2xl border flex items-center justify-between ${h.type === 'split' ? 'bg-indigo-50 border-indigo-100' : h.type === 'bulk' ? 'bg-teal-50 border-teal-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    {h.type === 'split' && (
                      <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        REQUEST PAYMENT
                      </span>
                    )}
                    {h.type === 'bulk' && (
                      <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                        BULK PAYOUT
                      </span>
                    )}
                    <div className="space-y-0.5">
                      {h.type === 'schedule' ? (
                        <>
                          <p className="text-xs font-bold text-emerald-700">✅ Executed — Job #{h.jobId}</p>
                          <p className="text-sm font-semibold text-slate-700">{h.amount} zkLTC → <span className="font-mono text-xs">{h.to.slice(0,8)}...{h.to.slice(-4)}</span></p>
                        </>
                      ) : h.type === 'split' ? (
                        <>
                          <p className="text-xs font-bold text-indigo-700 mt-1">💜 {h.description}</p>
                          <p className="text-sm font-semibold text-slate-700">{h.amount} {h.token} ← <span className="font-mono text-xs">{h.address.slice(0,8)}...{h.address.slice(-4)}</span></p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-teal-700 mt-1">📤 {h.description}</p>
                          <p className="text-sm font-semibold text-slate-700">{h.amount} {h.token} → <span className="font-mono text-xs">{h.address.slice(0,8)}...{h.address.slice(-4)}</span></p>
                        </>
                      )}
                      <p className="text-xs text-slate-400">{new Date(h.timestamp * 1000).toLocaleString()}</p>
                    </div>
                    <a href={h.type === 'schedule' ? `${LITVM_CHAIN.explorerUrl}/address/${import.meta.env.VITE_SCHEDULER_CONTRACT}` : h.type === 'bulk' ? `${LITVM_CHAIN.explorerUrl}/address/${import.meta.env.VITE_BULKPAYOUT_CONTRACT}` : `${LITVM_CHAIN.explorerUrl}/tx/${h.hash}`}
                      target="_blank" rel="noreferrer" className={h.type === 'split' ? 'text-indigo-500' : h.type === 'bulk' ? 'text-teal-500' : 'text-blue-500'}>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Sent', value: `${history.reduce((s,h) => s + Number(h.amount)/1e18, 0).toFixed(4)} zkLTC` },
                  { label: 'Executions', value: history.length },
                  { label: 'Unique Jobs', value: new Set(history.map(h => Number(h.jobId))).size },
                ].map((s,i) => (
                  <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-lg font-black text-blue-600">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-purple-700 flex items-center gap-2"><Sparkles className="w-4 h-4" />AI Analysis</p>
                  <button onClick={handleAISummary} disabled={isLoadingSummary}
                    className="text-xs px-3 py-1.5 rounded-xl bg-purple-500 text-white font-semibold disabled:opacity-50">
                    {isLoadingSummary ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
                <p className="text-xs text-purple-600">{aiSummary || 'Click Analyze to get AI insights on your spending patterns.'}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}