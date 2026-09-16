import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Wallet, Droplets, Send, Sparkles, X } from 'lucide-react';
import { sendZkLTC } from '../services/ethers';
import { setOnboardingState } from '../services/onboarding';

interface OnboardingWizardProps {
  isConnected: boolean;
  balance: string;
  account: string | null;
  startStep: number;
  onConnect: () => void;
  onFinished: () => void;
}

const DEMO_ADDRESS = '0x000000000000000000000000000000000000dEaD';
const DEMO_AMOUNT = '0.0001';

const FEATURES = [
  { icon: '💸', label: 'Send', desc: 'Real transactions' },
  { icon: '👥', label: 'Split', desc: 'Request from many' },
  { icon: '📤', label: 'Bulk Pay', desc: 'Pay many at once' },
  { icon: '⏰', label: 'Automate', desc: 'Schedule transfers' },
  { icon: '🔔', label: 'Reminders', desc: 'Never forget' },
  { icon: '🛡️', label: 'Escrow', desc: 'Trustless payments' },
];

export default function OnboardingWizard({ isConnected, balance, account, startStep, onConnect, onFinished }: OnboardingWizardProps) {
  const [step, setStep] = useState(startStep);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; hash?: string } | null>(null);

  useEffect(() => setStep(startStep), [startStep]);

  // Auto-advance from step 0 once wallet is connected
  useEffect(() => {
    if (isConnected && step === 0) {
      setStep(1);
      if (account) setOnboardingState(account, 1, false);
    }
  }, [isConnected, step, account]);

  const goTo = (s: number) => {
    setStep(s);
    if (account) setOnboardingState(account, s, false);
  };

  const finish = () => {
    if (account) setOnboardingState(account, 4, true);
    onFinished();
  };

  const handleTestSend = async () => {
    setSending(true);
    const result = await sendZkLTC(DEMO_ADDRESS, DEMO_AMOUNT);
    setSendResult(result);
    setSending(false);
    if (result.success) setTimeout(() => goTo(3), 1500);
  };

  const steps = ['Connect', 'Get Funds', 'First Send', 'Explore'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6"
      >
        <button onClick={finish} title="Skip setup" className="absolute top-4 right-4 text-slate-300 hover:text-slate-500">
          <X className="w-4 h-4" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((label, i) => (
            <div key={label} className="flex-1 flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Connect Your Wallet</h2>
              <p className="text-sm text-slate-500 mb-6">LitAgent needs a connected wallet to send zkLTC on your behalf. You always sign your own transactions — we never hold your keys.</p>
              <button onClick={onConnect} className="w-full py-3 rounded-2xl font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                Connect Wallet
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4">
                <Droplets className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Get Free Testnet zkLTC</h2>
              <p className="text-sm text-slate-500 mb-2">Your balance: <span className="font-bold text-slate-700">{parseFloat(balance).toFixed(6)} zkLTC</span></p>
              <p className="text-sm text-slate-500 mb-6">
                {parseFloat(balance) > 0
                  ? "You've already got funds — you can skip ahead."
                  : "You'll need a small amount of free testnet zkLTC to try a real transaction. It's free and instant."}
              </p>
              <a href="https://liteforge.hub.caldera.xyz" target="_blank" rel="noreferrer"
                className="block w-full py-3 rounded-2xl font-bold text-sm text-white text-center mb-3" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                Open Faucet
              </a>
              <button onClick={() => goTo(2)} className="w-full py-2.5 rounded-2xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200">
                {parseFloat(balance) > 0 ? "I'm ready, continue" : "I've got tokens, continue"}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
                <Send className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Try Your First Transaction</h2>
              <p className="text-sm text-slate-500 mb-4">We'll send a tiny real transaction — {DEMO_AMOUNT} zkLTC — so you see exactly how confirming a transaction feels. MetaMask will ask you to sign.</p>
              {sendResult?.success ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-emerald-700">Confirmed! That's really it.</p>
                </div>
              ) : (
                <button onClick={handleTestSend} disabled={sending || parseFloat(balance) <= 0}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                  {sending ? 'Confirm in MetaMask...' : `Send ${DEMO_AMOUNT} zkLTC (test)`}
                </button>
              )}
              {parseFloat(balance) <= 0 && !sendResult && (
                <p className="text-xs text-amber-600 mt-2 text-center">You need testnet zkLTC first — go back a step.</p>
              )}
              <button onClick={() => goTo(3)} className="w-full py-2 mt-2 text-xs text-slate-400 hover:text-slate-600">
                Skip this step
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">You're All Set</h2>
              <p className="text-sm text-slate-500 mb-4">Everything below works straight from chat — just type what you need.</p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {FEATURES.map((f) => (
                  <div key={f.label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-lg mb-0.5">{f.icon}</p>
                    <p className="text-[11px] font-bold text-slate-700">{f.label}</p>
                  </div>
                ))}
              </div>
              <button onClick={finish} className="w-full py-3 rounded-2xl font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                Start Using LitAgent
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}