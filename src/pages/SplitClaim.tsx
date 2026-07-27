import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { useWalletContext } from '../components/WalletContext';
import { getSplitRequest, markSplitPaid, SplitRequestRecord } from '../services/splitRequest';
import { sendZkLTC } from '../services/ethers';

export default function SplitClaim() {
  const { id } = useParams<{ id: string }>();
  const wallet = useWalletContext();
  const [record, setRecord] = useState<SplitRequestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    getSplitRequest(id).then((r) => {
      setRecord(r);
      setLoading(false);
    });
  }, [id]);

  const myShare = record?.recipients.find(
    (r) => r.address.toLowerCase() === (wallet.account || '').toLowerCase()
  );

  const handlePay = async () => {
    if (!record || !myShare) return;
    setPaying(true);
    const result = await sendZkLTC(record.creator, myShare.amount);
    if (result.success) {
      await markSplitPaid(record.id, myShare.address, result.hash);
      setRecord({
        ...record,
        recipients: record.recipients.map((r) =>
          r.address === myShare.address ? { ...r, paid: true, txHash: result.hash } : r
        ),
      });
    }
    setPaying(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <p className="text-slate-500">This split request doesn't exist or has expired.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">{record.description}</h2>
            <p className="text-xs text-slate-400">Split payment request</p>
          </div>
        </div>

        {!wallet.isConnected ? (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500 mb-4">Connect your wallet to see your share.</p>
            <button
              onClick={wallet.connect}
              className="px-5 py-2.5 rounded-2xl font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              Connect Wallet
            </button>
          </div>
        ) : !myShare ? (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500">
              You're not part of this split. Connected wallet doesn't match any recipient.
            </p>
          </div>
        ) : myShare.paid ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">You've paid your share</p>
            <p className="text-xs text-slate-400 font-mono truncate">{myShare.txHash}</p>
          </div>
        ) : (
          <div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 mb-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Your share</p>
              <p className="text-2xl font-black text-blue-600">{myShare.amount} {record.token}</p>
            </div>
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full py-3 rounded-2xl font-bold text-sm text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              {paying ? 'Sending...' : 'Pay Your Share'}
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 space-y-1">
          {record.recipients.map((r) => (
            <div key={r.address} className="flex justify-between text-xs">
              <span className="font-mono text-slate-500 truncate">{r.address}</span>
              <span className={r.paid ? 'text-green-600 font-semibold' : 'text-slate-400'}>
                {r.paid ? 'Paid' : 'Pending'}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={copyLink}
          className="w-full mt-4 py-2 rounded-2xl bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-200"
        >
          <Copy className="w-3.5 h-3.5" />
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </motion.div>
    </div>
  );
}