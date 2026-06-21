import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, X, Send, Loader2, ExternalLink } from 'lucide-react';
import { AgentAction } from '../services/claude';
import { LITVM_CHAIN } from '../config/litvm';

interface ConfirmModalProps {
  isOpen: boolean;
  action: AgentAction | null;
  estimatedGas?: string;
  isExecuting?: boolean;
  txResult?: { hash: string; success: boolean; error?: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  action,
  estimatedGas,
  isExecuting,
  txResult,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
            onClick={!isExecuting ? onCancel : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden pointer-events-auto"
              style={{ boxShadow: '0 25px 80px rgba(59, 130, 246, 0.25)' }}
            >
              {/* Header */}
              <div className="relative p-6 pb-4">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  }}
                />
                {!isExecuting && !txResult && (
                  <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 transition-colors z-10"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                )}
                <div className="relative flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
                  >
                    {isExecuting ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : txResult?.success ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : txResult?.error ? (
                      <AlertTriangle className="w-6 h-6 text-white" />
                    ) : (
                      <Send className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {isExecuting
                        ? 'Broadcasting...'
                        : txResult?.success
                        ? 'Transaction Sent!'
                        : txResult?.error
                        ? 'Transaction Failed'
                        : 'Confirm Transaction'}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {isExecuting
                        ? 'Please confirm in MetaMask'
                        : txResult
                        ? 'On LitVM LiteForge Testnet'
                        : 'Review before signing'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 space-y-4">
                {!txResult && (
                  <>
                    {/* Transaction details */}
                    <div className="rounded-2xl bg-slate-50 p-4 space-y-3 border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Action</span>
                        <span className="text-sm font-semibold text-slate-800 capitalize">
                          {action?.action}
                        </span>
                      </div>
                      {action?.to && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">To</span>
                          <span className="text-sm font-mono font-semibold text-slate-700">
                            {action.to.slice(0, 8)}...{action.to.slice(-6)}
                          </span>
                        </div>
                      )}
                      {action?.amount && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Amount</span>
                          <div className="text-right">
                            <span className="text-xl font-bold text-blue-600">
                              {action.amount}
                            </span>
                            <span className="text-sm font-semibold text-purple-600 ml-1">
                              zkLTC
                            </span>
                          </div>
                        </div>
                      )}
                      {estimatedGas && (
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                          <span className="text-sm text-slate-500">Est. Gas</span>
                          <span className="text-sm text-slate-600">{estimatedGas} zkLTC</span>
                        </div>
                      )}
                    </div>

                    {/* Warning */}
                    <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        MetaMask will open to sign this transaction. Never share your seed phrase.
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={onCancel}
                        disabled={isExecuting}
                        className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onConfirm}
                        disabled={isExecuting}
                        className="flex-1 py-3 rounded-2xl font-bold text-white shadow-lg transition-all disabled:opacity-60"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
                        }}
                      >
                        {isExecuting ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Signing...
                          </span>
                        ) : (
                          'Confirm & Send'
                        )}
                      </motion.button>
                    </div>
                  </>
                )}

                {/* Success state */}
                {txResult?.success && (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center">
                      <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                      <p className="text-green-700 font-semibold">Transaction Confirmed!</p>
                      {txResult.hash && (
                        <p className="text-xs text-green-600 font-mono mt-1 break-all">
                          {txResult.hash.slice(0, 20)}...{txResult.hash.slice(-8)}
                        </p>
                      )}
                    </div>
                    {txResult.hash && (
                      <a
                        href={`${LITVM_CHAIN.explorerUrl}/tx/${txResult.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Explorer
                      </a>
                    )}
                    <button
                      onClick={onCancel}
                      className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}

                {/* Error state */}
                {txResult && !txResult.success && (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
                      <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2 block" />
                      <p className="text-red-700 font-semibold text-center">Transaction Failed</p>
                      <p className="text-xs text-red-600 text-center mt-1">{txResult.error}</p>
                    </div>
                    <button
                      onClick={onCancel}
                      className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
