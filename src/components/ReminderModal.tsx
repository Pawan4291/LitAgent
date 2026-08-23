import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BellRing } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  initialTo?: string;
  initialAmount?: string;
  onConfirm: (data: { label: string; to: string | null; amount: string | null; startAt: number; intervalMs: number }) => void;
  onCancel: () => void;
}

const UNITS = [
  { label: 'Minutes', ms: 60000 },
  { label: 'Hours', ms: 3600000 },
  { label: 'Days', ms: 86400000 },
  { label: 'Weeks', ms: 604800000 },
  { label: 'Months', ms: 2592000000 },
];

export default function ReminderModal({ isOpen, initialTo, initialAmount, onConfirm, onCancel }: ReminderModalProps) {
  const [label, setLabel] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [repeatValue, setRepeatValue] = useState(1);
  const [unit, setUnit] = useState(UNITS[3]); // default: Weeks

  useEffect(() => {
    if (isOpen) {
      setLabel('');
      setTo(initialTo || '');
      setAmount(initialAmount || '');
      const d = new Date(Date.now() + 3600000);
      setDate(d.toISOString().slice(0, 10));
      setTime(d.toTimeString().slice(0, 5));
      setRepeatValue(1);
      setUnit(UNITS[3]);
    }
  }, [isOpen]);

  const startAt = date && time ? new Date(`${date}T${time}`).getTime() : 0;
  const intervalMs = repeatValue * unit.ms;
  const isValid = label.trim().length > 0 && startAt > 0 && intervalMs > 0;

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
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto"
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

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">FIRST REMINDER AT</label>
              <div className="flex gap-2">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-pink-400" />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-pink-400" />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">REPEAT EVERY</label>
              <div className="flex gap-2">
                <input type="number" min={1} value={repeatValue}
                  onChange={(e) => setRepeatValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-center focus:outline-none focus:border-pink-400" />
                <div className="flex-1 grid grid-cols-5 gap-1">
                  {UNITS.map((u) => (
                    <button key={u.label} onClick={() => setUnit(u)}
                      className={`py-2 rounded-xl text-[11px] font-semibold transition-all ${unit.label === u.label ? 'bg-pink-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200">Cancel</button>
              <button
                onClick={() => isValid && onConfirm({ label, to: to || null, amount: amount || null, startAt, intervalMs })}
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