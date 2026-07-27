import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Link2, Plus, Trash2 } from 'lucide-react';

export interface SplitRecipientInput {
  address: string;
  amount: string;
}

interface SplitRequestModalProps {
  isOpen: boolean;
  initialRecipients?: SplitRecipientInput[];
  initialAmount?: string;
  onConfirm: (data: {
    description: string;
    recipients: SplitRecipientInput[];
    deadline: string | null;
  }) => void;
  onCancel: () => void;
}

export default function SplitRequestModal({
  isOpen,
  initialRecipients,
  initialAmount,
  onConfirm,
  onCancel,
}: SplitRequestModalProps) {
  const [description, setDescription] = useState('');
  const [isEqualSplit, setIsEqualSplit] = useState(true);
  const [totalAmount, setTotalAmount] = useState(initialAmount || '');
  const [recipients, setRecipients] = useState<SplitRecipientInput[]>(
    initialRecipients && initialRecipients.length > 0
      ? initialRecipients
      : [{ address: '', amount: '' }]
  );
  const [newAddress, setNewAddress] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setIsEqualSplit(true);
      setTotalAmount(initialAmount || '');
      setRecipients(
        initialRecipients && initialRecipients.length > 0
          ? initialRecipients
          : []
      );
      setNewAddress('');
      setDeadline('');
    }
  }, [isOpen]);

  const addRecipient = () => {
    if (!newAddress.trim()) return;
    setRecipients((prev) => [...prev, { address: newAddress.trim(), amount: '' }]);
    setNewAddress('');
  };

  const removeRecipient = (index: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCustomAmount = (index: number, value: string) => {
    setRecipients((prev) =>
      prev.map((r, i) => (i === index ? { ...r, amount: value } : r))
    );
  };

  const equalShare =
    recipients.length > 0 && totalAmount
      ? (parseFloat(totalAmount) / recipients.length).toFixed(6)
      : '0';

  const customTotal = recipients.reduce(
    (sum, r) => sum + (parseFloat(r.amount) || 0),
    0
  );

  const isValid =
    description.trim().length > 0 &&
    recipients.length > 0 &&
    recipients.every((r) => r.address.trim().length > 0) &&
    (isEqualSplit
      ? parseFloat(totalAmount) > 0
      : customTotal > 0 && recipients.every((r) => parseFloat(r.amount) > 0));

  const handleConfirm = () => {
    if (!isValid) return;
    const finalRecipients = isEqualSplit
      ? recipients.map((r) => ({ address: r.address, amount: equalShare }))
      : recipients.map((r) => ({ address: r.address, amount: r.amount }));
    onConfirm({ description, recipients: finalRecipients, deadline: deadline || null });
  };

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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Split Payment Request</h2>
                  <p className="text-xs text-slate-400">Request zkLTC from multiple wallets</p>
                </div>
              </div>
              <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">WHAT ARE YOU SPLITTING?</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner at Mario's"
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Distribution toggle */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">DISTRIBUTION</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsEqualSplit(true)}
                  className={`py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    isEqualSplit ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Equal Split
                </button>
                <button
                  onClick={() => setIsEqualSplit(false)}
                  className={`py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    !isEqualSplit ? 'bg-purple-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Custom Amounts
                </button>
              </div>
            </div>

            {/* Total amount (equal split only) */}
            {isEqualSplit && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">TOTAL AMOUNT (zkLTC)</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:border-blue-400"
                />
                {recipients.length > 0 && totalAmount && (
                  <p className="text-xs text-slate-400 mt-1">
                    {equalShare} zkLTC each × {recipients.length} recipients
                  </p>
                )}
              </div>
            )}

            {/* Recipients */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">
                RECIPIENTS ({recipients.length})
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
                  placeholder="0x wallet address"
                  className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={addRecipient}
                  className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {recipients.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">Add recipients using the field above</p>
              )}

              <div className="space-y-2">
                {recipients.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="flex-1 text-xs font-mono text-slate-600 truncate">{r.address}</span>
                    {!isEqualSplit && (
                      <input
                        type="number"
                        value={r.amount}
                        onChange={(e) => updateCustomAmount(i, e.target.value)}
                        placeholder="0.00"
                        className="w-20 px-2 py-1 rounded-xl border border-slate-200 text-xs font-bold text-right focus:outline-none focus:border-purple-400"
                      />
                    )}
                    {isEqualSplit && (
                      <span className="text-xs font-bold text-blue-600">{equalShare}</span>
                    )}
                    <button onClick={() => removeRecipient(i)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {!isEqualSplit && recipients.length > 0 && (
                <p className="text-xs text-slate-400 mt-1">Custom total: {customTotal.toFixed(6)} zkLTC</p>
              )}
            </div>

            {/* Deadline */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">DEADLINE (OPTIONAL)</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400"
              />
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
                onClick={handleConfirm}
                disabled={!isValid}
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                <Link2 className="w-4 h-4" />
                Create Split & Share Link
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}