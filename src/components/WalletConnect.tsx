import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Zap, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { truncateAddress, switchToLitVM } from '../services/ethers';
import { LITVM_CHAIN } from '../config/litvm';

export default function WalletConnect() {
  const { account, balance, isConnected, isConnecting, isCorrectChain, error, connect, disconnect, refreshBalance } =
    useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwitchChain = async () => {
    await switchToLitVM();
    setShowDropdown(false);
  };

  if (!isConnected) {
    return (
      <motion.button
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={connect}
        disabled={isConnecting}
        className="relative group flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-semibold text-sm overflow-hidden shadow-lg shadow-blue-200/50"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
        }}
      >
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #0891b2 100%)',
          }}
        />
        <Wallet className="w-4 h-4 text-white relative z-10" />
        <span className="text-white relative z-10">
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </span>
        {isConnecting && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full relative z-10"
          />
        )}
      </motion.button>
    );
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 bg-white/80 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-200"
        style={{ borderColor: isCorrectChain ? '#3b82f6' : '#f59e0b' }}
      >
        {!isCorrectChain && (
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        )}
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: isCorrectChain ? '#22c55e' : '#f59e0b',
            boxShadow: `0 0 6px ${isCorrectChain ? '#22c55e' : '#f59e0b'}`,
          }}
        />
        <div className="text-left">
          <p className="text-xs text-slate-500 font-medium">
            {isCorrectChain ? 'LitVM LiteForge' : 'Wrong Network'}
          </p>
          <p className="text-sm font-semibold text-slate-800">{truncateAddress(account || '')}</p>
        </div>
        <div className="text-right pl-2 border-l border-slate-200">
          <p className="text-xs text-slate-500">Balance</p>
          <p className="text-sm font-bold" style={{ color: '#3b82f6' }}>
            {parseFloat(balance).toFixed(4)} <span className="text-xs font-semibold text-purple-600">zkLTC</span>
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Connected Account</p>
              <p className="text-sm font-mono font-semibold text-slate-700">{truncateAddress(account || '')}</p>
              <p className="text-lg font-bold mt-2" style={{ color: '#3b82f6' }}>
                {parseFloat(balance).toFixed(6)}{' '}
                <span className="text-sm text-purple-600">zkLTC</span>
              </p>
            </div>

            <div className="p-2">
              {!isCorrectChain && (
                <button
                  onClick={handleSwitchChain}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 transition-colors text-amber-600 mb-1"
                >
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">Switch to LitVM</span>
                </button>
              )}
              <button
                onClick={refreshBalance}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Refresh Balance</span>
              </button>
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy Address'}</span>
              </button>
              <a
                href={`${LITVM_CHAIN.explorerUrl}/address/${account}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">View on Explorer</span>
              </a>
              <button
                onClick={() => { disconnect(); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-red-500"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Disconnect</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-full mt-1 right-0 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 whitespace-nowrap"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
