import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, ExternalLink, RefreshCw, Database } from 'lucide-react';
import { Transaction } from '../services/goldsky';
import { truncateAddress } from '../services/ethers';
import { LITVM_CHAIN } from '../config/litvm';

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
  address: string;
  onRefresh: () => void;
  source?: 'goldsky' | 'rpc' | null;
  compact?: boolean;
}

export default function TransactionHistory({
  transactions,
  isLoading,
  address,
  onRefresh,
  source,
  compact = false,
}: TransactionHistoryProps) {
  const lowerAddr = address?.toLowerCase();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-3 border-blue-200 border-t-blue-500"
          style={{ borderWidth: '3px' }}
        />
        <p className="text-sm text-slate-500 font-medium">Fetching transactions...</p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Database className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">Connect your wallet to view transactions</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 flex items-center justify-center">
          <Database className="w-7 h-7 text-blue-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-600">No transactions found</p>
          <p className="text-xs text-slate-400 mt-1">Your LitVM history will appear here</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            {transactions.length} Transactions
          </span>
          {source && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium border border-emerald-200">
              {source === 'goldsky' ? '⚡ Goldsky' : '🔗 RPC'}
            </span>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </div>

      {/* TX list */}
      <div className="space-y-2">
        <AnimatePresence>
          {transactions.map((tx, i) => {
            const isSent = tx.from?.toLowerCase() === lowerAddr;
            const val = parseFloat(tx.value) || 0;
            const date = tx.timestamp
              ? new Date(tx.timestamp * 1000)
              : new Date();

            return (
              <motion.div
                key={tx.hash || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                className="group flex items-center gap-3 p-3 rounded-2xl bg-white/80 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    isSent
                      ? 'bg-gradient-to-br from-red-100 to-orange-100'
                      : 'bg-gradient-to-br from-green-100 to-emerald-100'
                  }`}
                >
                  {isSent ? (
                    <ArrowUpRight className="w-5 h-5 text-red-500" />
                  ) : (
                    <ArrowDownLeft className="w-5 h-5 text-green-500" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {isSent ? 'Sent' : 'Received'}
                    </span>
                    {!compact && (
                      <span className="text-xs text-slate-400 font-mono truncate">
                        {isSent
                          ? truncateAddress(tx.to || '')
                          : truncateAddress(tx.from || '')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-sm font-bold ${
                      isSent ? 'text-red-500' : 'text-emerald-500'
                    }`}
                  >
                    {isSent ? '-' : '+'}
                    {val.toFixed(4)}
                  </p>
                  <p className="text-xs text-purple-600 font-semibold">zkLTC</p>
                </div>

                {/* Explorer link */}
                {tx.hash && (
                  <a
                    href={`${LITVM_CHAIN.explorerUrl}/tx/${tx.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400 hover:text-blue-600" />
                  </a>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
