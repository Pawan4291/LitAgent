import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Plus, Trash2 } from 'lucide-react';

export interface BulkRecipientInput {
  address: string;
  amount: string;
}

interface BulkPayoutModalProps {
  isOpen: boolean;
  initialRecipients?: BulkRecipientInput[];
  availableBalance?: string;
  onConfirm: (data: { description: string; recipients: BulkRecipientInput[] }) => void;
  onCancel: () => void;
}

const MAX_RECIPIENTS = 20;

export default function BulkPayoutModal({
  isOpen,
  initialRecipients,
  availableBalance,
  onConfirm,
  onCancel,
}: BulkPayoutModalProps) {
  const [description, setDescription] = useState('');
  const [isEqualSplit, setIsEqualSplit] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [recipients, setRecipients] = useState<BulkRecipientInput[]>(
    initialRecipients && initialRecipients.length > 0 ? initialRecipients : []
  );
  const [newAddress, setNewAddress] = useState('');
  const [newAmount, setNewAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setIsEqualSplit(false);
      setTotalAmount('');
      setRecipients(initialRecipients && initialRecipients.length > 0 ? initialRecipients : []);
      setNewAddress('');
      setNewAmount('');
    }
  }, [isOpen]);

  const addRecipient = () => {
    if (!newAddress.trim()) return;
    if (recipients.length >= MAX_RECIPIENTS) return;
    if (!isEqualSplit && !newAmount.trim()) return;
    setRecipients((prev) => [...prev, { address: newAddress.trim(), amount: isEqualSplit ? '' : newAmount.trim() }]);
    setNewAddress('');
    setNewAmount('');
  };

  const removeRecipient = (index: number) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCustomAmount = (index: number, value: string) => {
    setRecipients((prev) => prev.map((r, i) => (i === index ? { ...r, amount: value } : r)));
  };

  const equalShare =
    recipients.length > 0 && totalAmount ? (parseFloat(totalAmount) / recipients.length).toFixed(6) : '0';

  const customTotal = recipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const grandTotal = isEqualSplit ? parseFloat(totalAmount) || 0 : customTotal;

  const isValid =
    recipients.length > 0 &&
    recipients.length <= MAX_RECIPIENTS &&
    recipients.every((r) => r.address.trim().length > 0) &&
    (isEqualSplit ? parseFloat(totalAmount) > 0 : customTotal > 0 && recipients.every((r) => parseFloat(r.amount) > 0));

  const handleConfirm = () => {
    if (!isValid) return;
    const finalRecipients = isEqualSplit
      ? recipients.map((r) => ({ address: r.address, amount: equalShare }))
      : recipients.map((r) => ({ address: r.address, amount: r.amount }));
    onConfirm({ description: description || 'Bulk Payout', recipients: finalRecipients });
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Bulk Payout</h2>
                  <p className="text-xs text-slate-400">Pay multiple wallets in one transaction</p>
                </div>
              </div>
              <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">PAYOUT DESCRIPTION</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Monthly Payroll #3"
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">DISTRIBUTION</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsEqualSplit(true)}
                  className={`py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    isEqualSplit ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Equal Split
                </button>
                <button
                  onClick={() => setIsEqualSplit(false)}
                  className={`py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    !isEqualSplit ? 'bg-teal-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Custom Amounts
                </button>
              </div>
            </div>

            {isEqualSplit && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">TOTAL AMOUNT (zkLTC)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:border-emerald-400"
                  />
                  {availableBalance && (
                    <button
                      onClick={() => setTotalAmount(availableBalance)}
                      className="px-4 rounded-2xl bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200"
                    >
                      MAX
                    </button>
                  )}
                </div>
                {availableBalance && <p className="text-xs text-slate-400 mt-1">Available: {availableBalance} zkLTC</p>}
                {recipients.length > 0 && totalAmount && (
                  <p className="text-xs text-slate-400 mt-1">{equalShare} zkLTC each × {recipients.length} recipients</p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">
                RECIPIENTS ({recipients.length}/{MAX_RECIPIENTS})
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
                  placeholder="0x wallet address"
                  className="flex-1 px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:border-emerald-400"
                />
                {!isEqualSplit && (
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
                    placeholder="0.00"
                    className="w-24 px-2 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-right focus:outline-none focus:border-teal-400"
                  />
                )}
                <button
                  onClick={addRecipient}
                  disabled={recipients.length >= MAX_RECIPIENTS}
                  className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50"
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
                        className="w-20 px-2 py-1 rounded-xl border border-slate-200 text-xs font-bold text-right focus:outline-none focus:border-teal-400"
                      />
                    )}
                    {isEqualSplit && <span className="text-xs font-bold text-emerald-600">{equalShare}</span>}
                    <button onClick={() => removeRecipient(i)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 mb-4 flex justify-between text-sm">
              <span className="text-slate-600 font-semibold">Total to send</span>
              <span className="font-black text-emerald-600">{grandTotal.toFixed(6)} zkLTC</span>
            </div>

            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValid}
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
              >
                <Send className="w-4 h-4" />
                Send Bulk Payout ({recipients.length} recipients)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}