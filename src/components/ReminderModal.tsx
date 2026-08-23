import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BellRing } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  initialTo?: string;
  initialAmount?: string;
  onConfirm: (data: { label: string; to: string | null; amount: string | null; repeat: 'daily' | 'weekly' | 'monthly' }) => void;
  onCancel: () => void;
}

export default function ReminderModal({ isOpen, initialTo, initialAmount, onConfirm, onCancel }: ReminderModalProps) {
  const [label, setLabel] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [repeat, setRepeat] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    if (isOpen) {
      setLabel('');
      setTo(initialTo || '');
      setAmount(initialAmount || '');
      setRepeat('weekly');
    }
  }, [isOpen]);

  const isValid = label.trim().length > 0;

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
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <BellRing className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Payment Reminder</h2>
                  <p className="text-xs text-slate-400">We'll nag you — you still send it yourself</p>
                </div>
              </div>
              <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">REMIND ME TO</label>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Pay rent"
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-pink-400" />
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">ADDRESS (OPTIONAL)</label>
              <input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x wallet address"
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:border-pink-400" />
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">AMOUNT (OPTIONAL)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:border-pink-400" />
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">REPEAT</label>
              <div className="grid grid-cols-3 gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((r) => (
                  <button key={r} onClick={() => setRepeat(r)}
                    className={`py-2.5 rounded-2xl text-sm font-semibold capitalize transition-all ${repeat === r ? 'bg-pink-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200">Cancel</button>
              <button
                onClick={() => isValid && onConfirm({ label, to: to || null, amount: amount || null, repeat })}
                disabled={!isValid}
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}
              >
                <BellRing className="w-4 h-4" />
                Set Reminder
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}