import { motion } from 'framer-motion';
import { Settings as SettingsIcon, ExternalLink, MessageSquare, Zap } from 'lucide-react';
import SafetySettings from '../components/SafetySettings';
import { LITVM_CHAIN } from '../config/litvm';

export default function Settings() {
  return (
    <div className="min-h-screen px-4 py-6 md:px-8 pb-28 md:pb-8">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background:
              'radial-gradient(ellipse at 60% 20%, #f0e6ff 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, #e0f2fe 0%, transparent 55%)',
          }}
        />
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Settings
            </h1>
            <p className="text-xs text-slate-500">Configure LitAgent</p>
          </div>
        </motion.div>

        {/* Safety settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SafetySettings />
        </motion.div>

        {/* Network info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            LitVM Network Info
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Network', value: 'LitVM LiteForge Testnet' },
              { label: 'Chain ID', value: `${LITVM_CHAIN.chainIdDecimal} (${LITVM_CHAIN.chainId})` },
              { label: 'Gas Token', value: 'zkLTC' },
              { label: 'RPC URL', value: LITVM_CHAIN.rpcUrl },
              { label: 'Explorer', value: LITVM_CHAIN.explorerUrl },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center gap-3 py-1.5 border-b border-blue-100 last:border-0">
                <span className="text-xs font-semibold text-slate-500">{label}</span>
                {value.startsWith('https') ? (
                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                  >
                    {value.replace('https://', '').slice(0, 30)}...
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                ) : (
                  <span className="text-xs font-mono text-slate-700 font-semibold">{value}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-white/80 border border-slate-200 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-800 mb-4">Resources</h3>
          <div className="space-y-2">
            {[
              {
                label: 'LitVM Website',
                url: 'https://litvm.com',
                icon: '🌐',
              },
              {
                label: 'LiteForge Block Explorer',
                url: LITVM_CHAIN.explorerUrl,
                icon: '🔍',
              },
              {
                label: 'Get testnet zkLTC (Faucet)',
                url: 'https://liteforge.hub.caldera.xyz/',
                icon: '🚰',
              },
              {
                label: 'Builders Program',
                url: 'https://builders.litvm.com',
                icon: '🏗️',
              },
              {
                label: 'LitVM Telegram',
                url: 'https://t.me/LitecoinVM',
                icon: '💬',
              },
              {
                label: 'Groq Console (API Key)',
                url: 'https://console.groq.com',
                icon: '🤖',
              },
            ].map(({ label, url, icon }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">
                    {label}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
              </a>
            ))}
          </div>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">LitAgent v1.0</h3>
              <p className="text-xs text-slate-400">AI Wallet on LitVM</p>
            </div>
          </div>
         <p className="text-xs text-slate-400 leading-relaxed">
  LitAgent is an open-source AI-powered wallet assistant built on LitVM LiteForge Testnet.
  Powered by Groq AI for natural language parsing and MetaMask for secure transaction signing.
  No private keys are ever stored.
</p>
<p className="text-xs text-slate-500 mt-3">
  Follow on{' '}
  <a href="https://x.com/litagentapp" target="_blank" rel="noreferrer"
    className="text-blue-400 hover:text-blue-300 font-semibold">
    X
  </a>
</p>
          <div className="flex gap-3 mt-4">
            <a
              href="https://litvm.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              LitVM
            </a>
            <a
              href="https://t.me/LitecoinVM"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Community
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
