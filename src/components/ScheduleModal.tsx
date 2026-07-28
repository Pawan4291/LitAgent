import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  toAddress: string;
  amount: string;
  onConfirm: (intervalSeconds: number, totalAmount: string, cycles: number) => void;
  onCancel: () => void;
}

const REPEAT_UNITS = ['Minutes', 'Hours', 'Days', 'Weeks', 'Months'];

export default function ScheduleModal({ isOpen, toAddress, amount, onCancel }: ScheduleModalProps) {
  const [mode, setMode] = useState<'onetime' | 'recurring'>('onetime');
  const [repeatValue, setRepeatValue] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState('Days');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Schedule Payment</h2>
                  <p className="text-xs text-slate-400">Set up recurring zkLTC transfer</p>
                </div>
              </div>
              <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* One-time / Recurring toggle */}
            <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setMode('onetime')}
                className={`py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'onetime' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
              >
                One-time
              </button>
              <button
                onClick={() => setMode('recurring')}
                className={`py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'recurring' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
              >
                Recurring
              </button>
            </div>

            {/* Sending to */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">SENDING TO</label>
              <input
                type="text"
                defaultValue={toAddress}
                placeholder="@alice or 0x..."
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">AMOUNT PER TRANSFER</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue={amount}
                  className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:border-blue-400"
                />
                <div className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-500 text-xs font-bold flex items-center">MAX</div>
                <div className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-500 text-xs font-bold flex items-center">zkLTC</div>
              </div>
              <p className="text-xs text-slate-400 mt-1">Available: 0.0000 zkLTC</p>
            </div>

            {mode === 'onetime' ? (
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">SEND AT</label>
                <div className="flex gap-2">
                  <input type="date" className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" />
                  <input type="time" className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <p className="text-xs text-slate-400 mt-1">⏱ Payment may take 2-3 minutes to reach the destination wallet after this time</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">START TIME (FIRST PAYMENT GOES AT THIS TIME)</label>
                  <div className="flex gap-2">
                    <input type="date" className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" />
                    <input type="time" className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">REPEAT EVERY</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={repeatValue}
                      onChange={(e) => setRepeatValue(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-center focus:outline-none focus:border-blue-400"
                    />
                    <div className="flex-1 grid grid-cols-5 gap-1">
                      {REPEAT_UNITS.map((u) => (
                        <button
                          key={u}
                          onClick={() => setRepeatUnit(u)}
                          className={`py-2 rounded-xl text-[11px] font-semibold transition-all ${repeatUnit === u ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">REPEAT UNTIL</label>
                  <div className="flex gap-2">
                    <input type="date" className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" />
                    <input type="time" className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </div>
              </>
            )}

            {/* Summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total cycles</span>
                <span className="font-bold text-slate-700">—</span>
              </div>
              <div className="flex justify-between text-sm border-t border-blue-100 pt-1 mt-1">
                <span className="text-slate-600 font-semibold">Total deposit needed</span>
                <span className="font-black text-blue-600">— zkLTC</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                disabled
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-slate-400 bg-slate-200 flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Clock className="w-4 h-4" />
                Under Maintenance
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}