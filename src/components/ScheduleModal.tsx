import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Zap, Calendar } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  toAddress: string;
  amount: string;
  onConfirm: (intervalSeconds: number, totalAmount: string, cycles: number) => void;
  onCancel: () => void;
}

const FREQUENCY_OPTIONS = [
  { label: 'Minutes', value: 'minutes', seconds: 60 },
  { label: 'Hours', value: 'hours', seconds: 3600 },
  { label: 'Days', value: 'days', seconds: 86400 },
  { label: 'Weeks', value: 'weeks', seconds: 604800 },
  { label: 'Months', value: 'months', seconds: 2592000 },
];

const DURATION_OPTIONS = [
  { label: '10 Minutes', seconds: 600 },
  { label: '30 Minutes', seconds: 1800 },
  { label: '1 Hour', seconds: 3600 },
  { label: '6 Hours', seconds: 21600 },
  { label: '12 Hours', seconds: 43200 },
  { label: '1 Day', seconds: 86400 },
  { label: '3 Days', seconds: 259200 },
  { label: '1 Week', seconds: 604800 },
  { label: '2 Weeks', seconds: 1209600 },
  { label: '1 Month', seconds: 2592000 },
  { label: '3 Months', seconds: 7776000 },
  { label: '6 Months', seconds: 15552000 },
  { label: '1 Year', seconds: 31536000 },
  { label: 'Custom', seconds: 0 },
];

export default function ScheduleModal({ isOpen, toAddress, amount, onConfirm, onCancel }: ScheduleModalProps) {
  const [freqValue, setFreqValue] = useState(3);
  const [freqUnit, setFreqUnit] = useState(FREQUENCY_OPTIONS[0]);
  const [durationOption, setDurationOption] = useState(DURATION_OPTIONS[0]);
  const [customDuration, setCustomDuration] = useState(30);
  const [customDurationUnit, setCustomDurationUnit] = useState(FREQUENCY_OPTIONS[1]);

  const intervalSeconds = freqValue * freqUnit.seconds;
  const durationSeconds = durationOption.seconds === 0
    ? customDuration * customDurationUnit.seconds
    : durationOption.seconds;
  const cycles = Math.floor(durationSeconds / intervalSeconds);
  const totalAmount = (parseFloat(amount || '0') * cycles).toFixed(4);

  const isValid = cycles >= 1 && parseFloat(amount) > 0 && intervalSeconds > 0;

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
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
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

            {/* To */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">SENDING TO</label>
              <div className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-sm font-mono text-slate-700 truncate">{toAddress}</p>
              </div>
            </div>

            {/* Amount per transfer */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">AMOUNT PER TRANSFER</label>
              <div className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-600">{amount} zkLTC</span>
                <span className="text-xs text-slate-400">per cycle</span>
              </div>
            </div>

            {/* Frequency */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">SEND EVERY</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={freqValue}
                  onChange={(e) => setFreqValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-center focus:outline-none focus:border-blue-400"
                />
                <div className="flex-1 grid grid-cols-3 gap-1">
                  {FREQUENCY_OPTIONS.slice(0, 3).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFreqUnit(opt)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                        freqUnit.value === opt.value
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 mt-1">
                {FREQUENCY_OPTIONS.slice(3).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFreqUnit(opt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                      freqUnit.value === opt.value
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">FOR HOW LONG</label>
              <div className="grid grid-cols-3 gap-1">
                {DURATION_OPTIONS.slice(0, 9).map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setDurationOption(opt)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      durationOption.label === opt.label
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1 mt-1">
                {DURATION_OPTIONS.slice(9).map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setDurationOption(opt)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      durationOption.label === opt.label
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Custom duration */}
              {durationOption.seconds === 0 && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    min={1}
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-center focus:outline-none focus:border-purple-400"
                  />
                  <div className="flex-1 grid grid-cols-3 gap-1">
                    {FREQUENCY_OPTIONS.slice(0, 3).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setCustomDurationUnit(opt)}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                          customDurationUnit.value === opt.value
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-600">SUMMARY</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total cycles</span>
                  <span className="font-bold text-slate-700">{isValid ? cycles : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Interval</span>
                  <span className="font-bold text-slate-700">Every {freqValue} {freqUnit.label.toLowerCase()}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-blue-100 pt-1 mt-1">
                  <span className="text-slate-600 font-semibold">Total deposit needed</span>
                  <span className="font-black text-blue-600">{isValid ? totalAmount : '—'} zkLTC</span>
                </div>
              </div>
            </div>

            {!isValid && (
              <p className="text-xs text-red-500 text-center mb-3">
                ⚠️ Interval must be shorter than total duration
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => isValid && onConfirm(intervalSeconds, totalAmount, cycles)}
                disabled={!isValid}
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                <Zap className="w-4 h-4" />
                Deposit & Schedule
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}