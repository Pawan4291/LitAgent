import ScheduleModal from '../components/ScheduleModal';
import { createOnChainJob } from '../services/ethers';
import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Zap, Trash2 } from 'lucide-react';
import ChatInput from '../components/ChatInput';
import AgentResponse from '../components/AgentResponse';
import ConfirmModal from '../components/ConfirmModal';
import NetworkStatus from '../components/NetworkStatus';
import { useWalletContext } from '../components/WalletContext';
import { useAgent } from '../hooks/useAgent';
import { useTransactions } from '../hooks/useTransactions';
import { sendZkLTC, estimateGas, isValidAddress } from '../services/ethers';
import { addJob, parseScheduleToMs, isRecurring } from '../services/scheduler';
import { STORAGE_KEYS } from '../config/constants';
import { AgentAction } from '../services/claude';

const WELCOME_MESSAGES = [
  "What's my zkLTC balance?",
  "Send 0.1 zkLTC to 0x742d...",
  "Show my transaction history",
  "Schedule 0.01 zkLTC daily to 0x...",
  "Analyze my spending this month",
];

export default function Home() {
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleAction, setScheduleAction] = useState<AgentAction | null>(null);
 const wallet = useWalletContext();
  const { messages, isThinking, processMessage, addAgentMessage, clearHistory } = useAgent();
  const { transactions, fetchTransactions } = useTransactions();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [pendingAction, setPendingAction] = useState<AgentAction | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [txResult, setTxResult] = useState<{ hash: string; success: boolean; error?: string } | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<string>('');
  const [welcomeIdx, setWelcomeIdx] = useState(0);

  // Rotate welcome examples
  useEffect(() => {
    const interval = setInterval(() => {
      setWelcomeIdx((i) => (i + 1) % WELCOME_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Fetch txs when wallet connects
  useEffect(() => {
    if (wallet.account) {
      fetchTransactions(wallet.account);
    }
  }, [wallet.account, fetchTransactions]);

  const handleSend = useCallback(
    async (userMessage: string) => {
      if (!wallet.isConnected) return;

     const action = await processMessage(userMessage, wallet.account || '', wallet.balance);
      if (!action) return;

      const isScheduleIntent = /every|daily|weekly|monthly|recurring|repeat|schedule|automate/i.test(userMessage);
      if (isScheduleIntent && action.action === 'send') {
        action.action = 'schedule';
      }

      const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');

      switch (action.action) {
        case 'send': {
          if (!action.to || !action.amount) {
            addAgentMessage("❌ I need both a **recipient address** and an **amount** to send. Try: *'Send 0.1 zkLTC to 0x...'*");
            return;
          }
          if (!isValidAddress(action.to)) {
            addAgentMessage(`❌ That address doesn't look valid: \`${action.to}\`. Please double-check.`);
            return;
          }
          const dailyLimit = settings.dailyLimit || 1;
          if (parseFloat(action.amount) > dailyLimit) {
            addAgentMessage(`⚠️ **Daily limit exceeded!** You're trying to send **${action.amount} zkLTC** but your limit is **${dailyLimit} zkLTC**. Update this in Settings.`);
            return;
          }
          const gas = await estimateGas(action.to, action.amount);
          setEstimatedGas(gas);
          setPendingAction(action);
          setTxResult(null);

         const isTrusted = (settings.whitelist || []).includes(action.to.toLowerCase());
if (settings.requireConfirm !== false && !isTrusted) {
  setShowConfirm(true);
} else {
  await executeAction(action);
}
          addAgentMessage(
            `💸 Ready to send **${action.amount} zkLTC** to \`${action.to}\`. ${settings.requireConfirm !== false ? 'Please confirm below.' : 'Processing...'}`,
            action
          );
          break;
        }

        case 'balance': {
          await wallet.refreshBalance();
          addAgentMessage(
            `💰 Your current balance is **${parseFloat(wallet.balance).toFixed(6)} zkLTC** on LitVM LiteForge Testnet.\n\n${
              parseFloat(wallet.balance) === 0
                ? '🚰 Need tokens? Get free zkLTC from the faucet at liteforge.hub.caldera.xyz'
                : '✅ Ready to transact!'
            }`,
            action
          );
          break;
        }

        case 'history': {
          if (wallet.account) {
            await fetchTransactions(wallet.account);
          }
          addAgentMessage(
            `📜 Fetching your transaction history from LitVM... Check the **History** tab for full details. You have **${transactions.length}** recent transactions.`,
            action
          );
          break;
        }

       case 'schedule': {
  setScheduleAction(action);
  setShowSchedule(true);
  if (!action.to || !action.amount) {
    addAgentMessage(`⏰ Opening schedule builder! Please fill in the address and amount in the form.`, action);
  } else {
    addAgentMessage(`⏰ Opening schedule builder for **${action.amount} zkLTC** to \`${action.to?.slice(0,8)}...\``, action);
  }
  break;
}

        case 'stats': {
          addAgentMessage(
            `📊 Check the **History** tab for your full spending breakdown with AI-powered analysis. You have ${transactions.length} transactions on record.`,
            action
          );
          break;
        }

        case 'help': {
          addAgentMessage(
            `🤖 **LitAgent** — Your AI wallet assistant on LitVM LiteForge Testnet\n\n**I can help you:**\n\n💸 **Send zkLTC** — *"Send 0.5 zkLTC to 0x742d..."*\n💰 **Check balance** — *"What's my balance?"*\n📜 **View history** — *"Show my transactions"*\n⏰ **Schedule transfers** — *"Send 0.01 zkLTC to 0x... every day"*\n📊 **Spending stats** — *"Analyze my spending"*\n\n🔒 Your private key is **never** stored — you always sign with MetaMask.\n\nPowered by **Groq AI** + **LitVM LiteForge** ⚡`,
            action
          );
          break;
        }

        default: {
          addAgentMessage(
            `🤔 ${action.message || "I'm not sure what you meant. Try asking about your balance, sending zkLTC, or view transaction history."}`
          );
        }
      }
    },
    [wallet, processMessage, addAgentMessage, fetchTransactions, transactions.length]
  );

  const executeAction = async (action: AgentAction) => {
    if (!action.to || !action.amount) return;
    setIsExecuting(true);
    try {
      const result = await sendZkLTC(action.to, action.amount);
      setTxResult(result);
      if (result.success) {
        addAgentMessage(
          `✅ **Transaction confirmed!** Sent **${action.amount} zkLTC** to \`${action.to.slice(0, 8)}...\`\n\nTx Hash: \`${result.hash}\``,
          action,
          result.hash,
          'confirmed'
        );
        wallet.refreshBalance();
      } else {
        addAgentMessage(
          `❌ Transaction failed: ${result.error}`,
          action,
          undefined,
          'failed'
        );
      }
    } catch (err: any) {
      setTxResult({ hash: '', success: false, error: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    await executeAction(pendingAction);
  };

 const handleCancel = () => {
    setShowConfirm(false);
    setPendingAction(null);
    setTxResult(null);
    setIsExecuting(false);
    addAgentMessage('❌ Transaction cancelled by user.');
  };
  const handleClose = () => {
    setShowConfirm(false);
    setPendingAction(null);
    setTxResult(null);
    setIsExecuting(false);
  };

  const hasMessages = messages.length > 0;
  const handleScheduleConfirm = async (intervalSeconds: number, totalAmount: string, cycles: number) => {
  setShowSchedule(false);
  if (!scheduleAction?.to) return;
  addAgentMessage(`⏳ Depositing ${totalAmount} zkLTC for ${cycles} cycles...`);
  const label = `${scheduleAction.amount} zkLTC every ${intervalSeconds}s`;
 const cleanAmount = totalAmount.toString().replace(/[^0-9.]/g, '');
const result = await createOnChainJob(scheduleAction.to, intervalSeconds, cleanAmount, cycles, label);
 if (result.success) {
addAgentMessage(
  `✅ Scheduled! ${cycles} payments locked.\n\nTx: \`${result.hash}\``,
  undefined,
  result.hash,
  'confirmed'
);
  } else {
    addAgentMessage(`❌ Failed: ${result.error}`);
  }
};

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-72px)]">
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
        />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 md:px-8 pb-4">
        <AnimatePresence>
          {!hasMessages ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-6"
            >
              {/* Hero icon */}
              <motion.div
                animate={{
                  y: [0, -12, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
                  boxShadow: '0 20px 60px rgba(59, 130, 246, 0.35)',
                }}
              >
                <Bot className="w-10 h-10 text-white" />
              </motion.div>

              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Hello, I'm{' '}
                  <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    LitAgent
                  </span>
                </h1>
                <p className="text-slate-500 text-base max-w-sm mx-auto leading-relaxed">
                  Your AI-powered zkLTC wallet assistant on{' '}
                  <span className="font-semibold text-blue-600">LitVM LiteForge</span>
                </p>
              </div>

              {/* Animated example */}
              <div className="px-5 py-3 rounded-2xl bg-white/80 border border-slate-200 shadow-md backdrop-blur-sm">
                <p className="text-xs text-slate-400 mb-1.5">Try asking:</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={welcomeIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-sm font-semibold text-slate-700"
                  >
                    "{WELCOME_MESSAGES[welcomeIdx]}"
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {[
                  { icon: '💸', label: 'Send zkLTC', desc: 'Real transactions' },
                  { icon: '⏰', label: 'Automate', desc: 'Schedule transfers' },
                  { icon: '📊', label: 'Analytics', desc: 'AI spending stats' },
                  { icon: '🔒', label: 'Safe', desc: 'You always sign' },
                ].map((f) => (
                  <motion.div
                    key={f.label}
                    whileHover={{ scale: 1.03, y: -2 }}
                    className="p-3 rounded-2xl bg-white/70 border border-slate-100 shadow-sm text-left"
                  >
                    <p className="text-xl mb-1">{f.icon}</p>
                    <p className="text-xs font-bold text-slate-700">{f.label}</p>
                    <p className="text-xs text-slate-400">{f.desc}</p>
                  </motion.div>
                ))}
              </div>

              {!wallet.isConnected && (
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 border border-blue-200"
                >
                  <Zap className="w-4 h-4 text-blue-500" />
                  <p className="text-sm text-blue-700 font-medium">
                    Connect your wallet above to start
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="messages" className="space-y-4">
              {/* Clear history button */}
              

              {messages.map((msg, i) => (
                <AgentResponse key={msg.id} message={msg} index={i} />
              ))}

              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-3xl rounded-tl-lg bg-white/90 border border-slate-100 shadow-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          className="w-2 h-2 rounded-full bg-blue-400"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">LitAgent thinking...</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
<div
  className="flex-shrink-0 px-4 py-4 md:px-8 pb-20 md:pb-4"
  style={{
    background: 'linear-gradient(to top, rgba(248,250,252,0.95) 70%, transparent)',
    backdropFilter: 'blur(10px)',
  }}
>
  <div className="max-w-3xl mx-auto">
    <ChatInput
      onSend={handleSend}
      isLoading={isThinking || isExecuting}
      isConnected={wallet.isConnected}
      onClearHistory={clearHistory}
      hasMessages={hasMessages}
    />
  </div>
</div>

      {/* Confirm modal */}
     <ConfirmModal
  isOpen={showConfirm}
  action={pendingAction}
  estimatedGas={estimatedGas}
  isExecuting={isExecuting}
  txResult={txResult}
  onConfirm={handleConfirm}
  onCancel={txResult?.success ? handleClose : handleCancel}
/>
      <ScheduleModal
  isOpen={showSchedule}
  toAddress={scheduleAction?.to || ''}
  amount={scheduleAction?.amount || '0'}
  onConfirm={handleScheduleConfirm}
  onCancel={() => {
  setShowSchedule(false);
  setScheduleAction(null);
  addAgentMessage('❌ Schedule cancelled by user.');
}}
/>
    </div>
  );
}
