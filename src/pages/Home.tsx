import ScheduleModal from '../components/ScheduleModal';
import SplitRequestModal from '../components/SplitRequestModal';
import { createSplitRequest } from '../services/splitRequest';
import BulkPayoutModal from '../components/BulkPayoutModal';
import { bulkSend } from '../services/ethers';
import { logBulkPayout } from '../services/bulkLog';
import { getOnChainHistory, getOnChainJobs } from '../services/ethers';
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
import { getTemplates, TemplateRecord } from '../services/templates';
import ReminderModal from '../components/ReminderModal';
import { createReminder, getReminders, snoozeReminder, ReminderRecord } from '../services/reminders';
import EscrowModal from '../components/EscrowModal';
import { createEscrow } from '../services/ethers';

const WELCOME_MESSAGES = [
  "What's my zkLTC balance?",
  "Send 0.1 zkLTC to 0x742d...",
  "Show my transaction history",
  "Split 0.1 zkLTC between two wallets",
  "Bulk pay 5 wallets at once",
  "Analyze my spending this month",
];

export default function Home() {
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleAction, setScheduleAction] = useState<AgentAction | null>(null);
  const [showSplit, setShowSplit] = useState(false);
  const [splitAction, setSplitAction] = useState<AgentAction | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkAction, setBulkAction] = useState<AgentAction | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderAction, setReminderAction] = useState<AgentAction | null>(null);
  const [dueReminders, setDueReminders] = useState<ReminderRecord[]>([]);
  const [showEscrow, setShowEscrow] = useState(false);
  const [escrowAction, setEscrowAction] = useState<AgentAction | null>(null);
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
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);

  const refreshTemplates = useCallback(() => {
    if (wallet.account) getTemplates(wallet.account).then(setTemplates);
  }, [wallet.account]);

  useEffect(() => { refreshTemplates(); }, [refreshTemplates]);

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

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isLowBalance = wallet.lowBalanceThreshold > 0 && parseFloat(wallet.balance) < wallet.lowBalanceThreshold;

  useEffect(() => {
    if (!isLowBalance) setBannerDismissed(false);
  }, [isLowBalance]);

  useEffect(() => {
    if (!wallet.account) return;
    getReminders(wallet.account).then((records) => {
      const due = records.filter((r) => r.active && r.nextDue <= Date.now());
      setDueReminders(due);
    });
  }, [wallet.account]);

  const dismissReminder = async (r: ReminderRecord) => {
    if (!wallet.account) return;
    await snoozeReminder(wallet.account, r.id);
    setDueReminders((prev) => prev.filter((d) => d.id !== r.id));
  };

  const payReminderNow = async (r: ReminderRecord) => {
    await dismissReminder(r);
    if (r.to && r.amount) {
      handleSend(`Send ${r.amount} zkLTC to ${r.to}`);
    } else {
      addAgentMessage(`🔔 **${r.label}** — fill in the address/amount to send.`);
    }
  };

  const handleSend = useCallback(
    async (userMessage: string) => {
      if (!wallet.isConnected) return;

     const action = await processMessage(userMessage, wallet.account || '', wallet.balance);
      if (!action) return;

      const isScheduleIntent = /every|daily|weekly|monthly|recurring|repeat|schedule|automate/i.test(userMessage);
      if (isScheduleIntent && action.action === 'send') {
        action.action = 'schedule';
      }

      const isSplitIntent = /split|request payment|request from|divide between|collect from|split bill/i.test(userMessage);
      if (isSplitIntent) {
        action.action = 'split';
      }

      const isBulkIntent = /bulk|payroll|pay everyone|send to multiple|send to each/i.test(userMessage);
      if (isBulkIntent) {
        action.action = 'bulk';
      }

      const isReminderIntent = /remind me|reminder|nag me|don't let me forget/i.test(userMessage);
      if (isReminderIntent) {
        action.action = 'reminder';
      }

      const isEscrowIntent = /escrow|hold funds|secure payment|release when|pay only if|lock until confirmed/i.test(userMessage);
      if (isEscrowIntent) {
        action.action = 'escrow';
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
          if (parseFloat(action.amount) > parseFloat(wallet.balance)) {
            addAgentMessage(`❌ **Insufficient balance.** You're trying to send **${action.amount} zkLTC** but your wallet only has **${parseFloat(wallet.balance).toFixed(6)} zkLTC**. Get more from the faucet or send a smaller amount.`);
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
  const hist = await getOnChainHistory(wallet.account || '');
  addAgentMessage(
    `📜 You have **${hist.length}** on-chain executions recorded. Check the **History** tab for full details and AI spending analysis.`,
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

        case 'split': {
  setSplitAction(action);
  setShowSplit(true);
  addAgentMessage(`👥 Opening split request builder! Add recipients and amounts in the form.`, action);
  break;
}

        case 'bulk': {
  setBulkAction(action);
  setShowBulk(true);
  addAgentMessage(`📤 Opening bulk payout builder! Add recipients and amounts in the form.`, action);
  break;
}

        case 'reminder': {
  setReminderAction(action);
  setShowReminder(true);
  addAgentMessage(`🔔 Opening reminder builder! Fill in what to remind you about.`, action);
  break;
}

        case 'escrow': {
  setEscrowAction(action);
  setShowEscrow(true);
  addAgentMessage(`🛡️ Opening escrow builder! Funds stay locked until you confirm receipt.`, action);
  break;
}

        case 'stats': {
  const hist = await getOnChainHistory(wallet.account || '');
  const jobs = await getOnChainJobs(wallet.account || '');
  const active = Array.from(jobs).filter((j: any) => j.active).length;
  const completed = Array.from(jobs).filter((j: any) => !j.active && Number(j.executedCycles) >= Number(j.maxCycles)).length;
  const cancelled = Array.from(jobs).filter((j: any) => !j.active && Number(j.executedCycles) < Number(j.maxCycles)).length;
  addAgentMessage(
    `📊 **Your LitAgent Stats:**\n\n⚡ **${hist.length}** total executions\n✅ **${active}** active jobs\n🏁 **${completed}** completed jobs\n❌ **${cancelled}** cancelled jobs\n\nCheck **History** tab for AI spending analysis.`,
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

const handleBulkConfirm = async (data: { description: string; recipients: { address: string; amount: string }[] }) => {
  setShowBulk(false);
  const total = data.recipients.reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);
  if (total > parseFloat(wallet.balance)) {
    addAgentMessage(`❌ **Insufficient balance.** This bulk payout needs **${total.toFixed(6)} zkLTC** but your wallet only has **${parseFloat(wallet.balance).toFixed(6)} zkLTC**.`);
    return;
  }
  addAgentMessage(`⏳ Sending bulk payout to ${data.recipients.length} recipients...`);
  const result = await bulkSend(
    data.recipients.map(r => r.address),
    data.recipients.map(r => r.amount),
    data.description
  );
  if (result.success) {
    await logBulkPayout(wallet.account || '', data.description, data.recipients, result.hash);
    addAgentMessage(
      `✅ Bulk payout sent to ${data.recipients.length} wallets!\n\nTx: \`${result.hash}\``,
      { ...bulkAction!, action: 'bulk' } as AgentAction,
      result.hash,
      'confirmed'
    );
    wallet.refreshBalance();
  } else {
    addAgentMessage(`❌ Bulk payout failed: ${result.error}`);
  }
};

const handleEscrowConfirm = async (data: { seller: string; amount: string; deadlineSeconds: number; label: string }) => {
  setShowEscrow(false);
  if (parseFloat(data.amount) > parseFloat(wallet.balance)) {
    addAgentMessage(`❌ **Insufficient balance.** This escrow needs **${data.amount} zkLTC** but your wallet only has **${parseFloat(wallet.balance).toFixed(6)} zkLTC**.`);
    return;
  }
  addAgentMessage(`⏳ Locking ${data.amount} zkLTC in escrow...`);
  const result = await createEscrow(data.seller, data.amount, data.deadlineSeconds, data.label);
  if (result.success) {
    addAgentMessage(
      `✅ Funds locked! **${data.label}** — ${data.amount} zkLTC held until you confirm receipt or the deadline passes.\n\nTx: \`${result.hash}\`\n\n<a href="/automations" style="color:#d97706;font-weight:600;">→ Check your escrow here</a>`,
      { ...escrowAction!, action: 'escrow' } as AgentAction,
      result.hash,
      'confirmed'
    );
    wallet.refreshBalance();
  } else {
    addAgentMessage(`❌ Escrow failed: ${result.error}`);
  }
};

const handleReminderConfirm = async (data: { label: string; to: string | null; amount: string | null; startAt: number; intervalMs: number | null; repeatUntil: number | null }) => {
  setShowReminder(false);
  if (!wallet.account) return;
  const ok = await createReminder(wallet.account, data.label, data.to, data.amount, data.startAt, data.intervalMs, data.repeatUntil);
  addAgentMessage(ok ? `✅ Reminder set: **${data.label}**, starting ${new Date(data.startAt).toLocaleString()}.\n\n<a href="/automations" style="color:#ec4899;font-weight:600;">→ Check your reminders here</a>` : `❌ Failed to set reminder.`);
};

const handleSplitConfirm = async (data: { description: string; recipients: { address: string; amount: string }[]; deadline: string | null }) => {
  setShowSplit(false);
  if (!wallet.account) return;
  const result = await createSplitRequest(wallet.account, data.description, data.recipients, data.deadline);
 if (result.success && result.id) {
    const link = `${window.location.origin}/split/${result.id}`;
    navigator.clipboard.writeText(link);
    addAgentMessage(`✅ Split request created! Link copied to clipboard:\n\n${link}\n\n<a href="/history?tab=splits" style="color:#4f46e5;font-weight:600;">→ Track your request payments here</a>`, { ...splitAction!, action: 'split' } as AgentAction);
  } else {
    addAgentMessage(`❌ Failed to create split: ${result.error}`);
  }
};

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-72px)]">
      {isLowBalance && !bannerDismissed && (
        <div className="relative flex items-center justify-center px-4 py-2.5 bg-red-50 border-b border-red-200 flex-shrink-0">
          <p className="text-xs font-semibold text-red-600 text-center">
            ⚠️ Balance below {wallet.lowBalanceThreshold} zkLTC — currently {parseFloat(wallet.balance).toFixed(6)} zkLTC.
          </p>
          <button onClick={() => setBannerDismissed(true)} className="absolute right-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

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
              <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                {[
                  { icon: '💸', label: 'Send zkLTC', desc: 'Real transactions' },
                  { icon: '👥', label: 'Split', desc: 'Request from many' },
                  { icon: '📤', label: 'Bulk Pay', desc: 'Pay many at once' },
                  { icon: '⏰', label: 'Automate', desc: 'Schedule transfers' },
                  { icon: '🔔', label: 'Reminders', desc: 'Never forget' },
                  { icon: '🛡️', label: 'Escrow', desc: 'Trustless payments' },
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

      {/* Due reminders floating card */}
      {dueReminders.length > 0 && (
        <div className="fixed bottom-28 right-4 md:right-8 z-40 space-y-2 max-w-xs">
          {dueReminders.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-2xl bg-white shadow-xl border border-pink-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-bold text-slate-800">🔔 {r.label}</p>
                <button onClick={() => dismissReminder(r)} className="text-slate-300 hover:text-red-500 text-xs flex-shrink-0">✕</button>
              </div>
              {(r.amount || r.to) && (
                <p className="text-xs text-slate-500 mb-3">
                  {r.amount ? `${r.amount} zkLTC` : ''}{r.amount && r.to ? ' → ' : ''}{r.to ? `${r.to.slice(0,8)}...${r.to.slice(-4)}` : ''}
                </p>
              )}
              <button onClick={() => payReminderNow(r)}
                className="w-full py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>
                Pay Now
              </button>
            </motion.div>
          ))}
        </div>
      )}

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
      templates={templates}
      walletAddress={wallet.account || ''}
      onTemplateSaved={refreshTemplates}
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
      <SplitRequestModal
        isOpen={showSplit}
        initialRecipients={(splitAction?.recipients || []).map(r => ({ address: r.address, amount: r.amount || '' }))}
        initialAmount={splitAction?.amount || ''}
        availableBalance={wallet.balance}
        onConfirm={handleSplitConfirm}
        onCancel={() => {
          setShowSplit(false);
          setSplitAction(null);
          addAgentMessage('❌ Split request cancelled by user.');
        }}
      />
      <BulkPayoutModal
        isOpen={showBulk}
        initialRecipients={(bulkAction?.recipients || []).map(r => ({ address: r.address, amount: r.amount || '' }))}
        availableBalance={wallet.balance}
        onConfirm={handleBulkConfirm}
        onCancel={() => {
          setShowBulk(false);
          setBulkAction(null);
          addAgentMessage('❌ Bulk payout cancelled by user.');
        }}
      />
      <ReminderModal
        isOpen={showReminder}
        initialTo={reminderAction?.to || ''}
        initialAmount={reminderAction?.amount || ''}
        onConfirm={handleReminderConfirm}
        onCancel={() => {
          setShowReminder(false);
          setReminderAction(null);
          addAgentMessage('❌ Reminder cancelled by user.');
        }}
      />
      <EscrowModal
        isOpen={showEscrow}
        initialTo={escrowAction?.to || ''}
        initialAmount={escrowAction?.amount || ''}
        availableBalance={wallet.balance}
        onConfirm={handleEscrowConfirm}
        onCancel={() => {
          setShowEscrow(false);
          setEscrowAction(null);
          addAgentMessage('❌ Escrow cancelled by user.');
        }}
      />
    </div>
  );
}
