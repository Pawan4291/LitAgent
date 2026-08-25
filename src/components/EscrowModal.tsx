import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';

interface EscrowModalProps {
  isOpen: boolean;
  initialTo?: string;
  initialAmount?: string;
  availableBalance?: string;
  onConfirm: (data: { seller: string; amount: string; deadlineSeconds: number; label: string }) => void;
  onCancel: () => void;
}

const DEADLINE_OPTIONS = [
  { label: '1 Day', seconds: 86400 },
  { label: '3 Days', seconds: 259200 },
  { label: '1 Week', seconds: 604800 },
  { label: '2 Weeks', seconds: 1209600 },
  { label: '1 Month', seconds: 2592000 },
];

export default function EscrowModal({ isOpen, initialTo, initialAmount, availableBalance, onConfirm, onCancel }: EscrowModalProps) {
  const [label, setLabel] = useState('');
  const [seller, setSeller] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState(DEADLINE_OPTIONS[2]); // default: 1 week

  useEffect(() => {
    if (isOpen) {
      setLabel('');
      setSeller(initialTo || '');
      setAmount(initialAmount || '');
      setDeadline(DEADLINE_OPTIONS[2]);
    }
  }, [isOpen]);

  const isValid = label.trim().length > 0 && seller.trim().length > 0 && parseFloat(amount) > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Escrow Payment</h2>
                  <p className="text-xs text-slate-400">Funds locked until you confirm receipt</p>
                </div>
              </div>
              <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">WHAT'S THIS FOR?</label>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Freelance design work"
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-amber-400" />
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">SELLER ADDRESS</label>
              <input type="text" value={seller} onChange={(e) => setSeller(e.target.value)} placeholder="0x wallet address"
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:border-amber-400" />
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">AMOUNT (zkLTC)</label>
              <div className="flex gap-2">
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                  className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:border-amber-400" />
                {availableBalance && (
                  <button onClick={() => setAmount(availableBalance)} className="px-4 rounded-2xl bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200">MAX</button>
                )}
              </div>
              {availableBalance && <p className="text-xs text-slate-400 mt-1">Available: {availableBalance} zkLTC</p>}
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">REFUND IF NOT RELEASED WITHIN</label>
              <div className="grid grid-cols-3 gap-2">
                {DEADLINE_OPTIONS.map((d) => (
                  <button key={d.label} onClick={() => setDeadline(d)}
                    className={`py-2.5 rounded-2xl text-xs font-semibold transition-all ${deadline.label === d.label ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">If you don't confirm receipt by then, you can reclaim your funds anytime after.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200">Cancel</button>
              <button
                onClick={() => isValid && onConfirm({ seller, amount, deadlineSeconds: deadline.seconds, label })}
                disabled={!isValid}
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                <ShieldCheck className="w-4 h-4" />
                Lock Funds
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}