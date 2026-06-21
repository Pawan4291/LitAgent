import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { computeSpendingStats, Transaction } from '../services/goldsky';
import { truncateAddress } from '../services/ethers';

interface SpendingStatsProps {
  transactions: Transaction[];
  address: string;
  aiSummary?: string;
  isLoadingSummary?: boolean;
  onRefreshSummary?: () => void;
}

export default function SpendingStats({
  transactions,
  address,
  aiSummary,
  isLoadingSummary,
  onRefreshSummary,
}: SpendingStatsProps) {
  const stats = computeSpendingStats(transactions, address);

  const statCards = [
    {
      label: 'Total Sent',
      value: stats.totalSent.toFixed(4),
      unit: 'zkLTC',
      icon: TrendingDown,
      color: 'from-red-400 to-orange-500',
      bg: 'from-red-50 to-orange-50',
      border: 'border-red-200',
      textColor: 'text-red-600',
      count: stats.sentCount,
    },
    {
      label: 'Total Received',
      value: stats.totalReceived.toFixed(4),
      unit: 'zkLTC',
      icon: TrendingUp,
      color: 'from-emerald-400 to-teal-500',
      bg: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200',
      textColor: 'text-emerald-600',
      count: stats.receivedCount,
    },
    {
      label: 'Transactions',
      value: stats.txCount.toString(),
      unit: 'total',
      icon: BarChart3,
      color: 'from-blue-400 to-indigo-500',
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      textColor: 'text-blue-600',
      count: null,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`p-4 rounded-2xl bg-gradient-to-br ${s.bg} border ${s.border} shadow-sm`}
          >
            <div
              className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-sm`}
            >
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className={`text-xl font-bold ${s.textColor}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {s.unit}
              {s.count !== null && (
                <span className="ml-1 text-slate-400">({s.count} txns)</span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Monthly chart (text bars) */}
      {stats.monthlyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-white/80 border border-slate-100 shadow-sm"
        >
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Monthly Activity
          </h4>
          <div className="space-y-3">
            {stats.monthlyData.map((m) => {
              const maxVal = Math.max(
                ...stats.monthlyData.flatMap((d) => [d.sent, d.received]),
                0.001
              );
              const sentPct = Math.min((m.sent / maxVal) * 100, 100);
              const recvPct = Math.min((m.received / maxVal) * 100, 100);

              return (
                <div key={m.month}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{m.month}</span>
                    <span>
                      <span className="text-red-500 font-medium">↑{m.sent}</span>
                      {' / '}
                      <span className="text-emerald-500 font-medium">↓{m.received}</span>
                      <span className="text-slate-400"> zkLTC</span>
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sentPct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-red-400 to-orange-400"
                      />
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${recvPct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Top recipients */}
      {stats.topRecipients.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-2xl bg-white/80 border border-slate-100 shadow-sm"
        >
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Top Recipients</h4>
          <div className="space-y-2">
            {stats.topRecipients.map((r, i) => (
              <div key={r.address} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <span className="text-xs font-mono text-slate-600 flex-1">
                  {truncateAddress(r.address)}
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {r.total.toFixed(4)} <span className="text-purple-600">zkLTC</span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Analysis
          </h4>
          {onRefreshSummary && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefreshSummary}
              disabled={isLoadingSummary}
              className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-500 transition-colors disabled:opacity-50"
            >
              {isLoadingSummary ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
            </motion.button>
          )}
        </div>
        {isLoadingSummary ? (
          <div className="flex items-center gap-2 text-sm text-purple-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing your transactions...</span>
          </div>
        ) : aiSummary ? (
          <p className="text-sm text-purple-700 leading-relaxed">{aiSummary}</p>
        ) : (
          <p className="text-sm text-purple-500 italic">
            Set your Claude API key in Settings and click refresh to get an AI analysis of your spending.
          </p>
        )}
      </motion.div>
    </div>
  );
}
