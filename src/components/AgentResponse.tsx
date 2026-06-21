import { motion } from 'framer-motion';
import { Bot, User, ExternalLink, CheckCircle, Clock, XCircle, Zap, Hash } from 'lucide-react';
import { ChatMessage } from '../hooks/useAgent';
import { LITVM_CHAIN } from '../config/litvm';
import { truncateAddress } from '../services/ethers';

interface AgentResponseProps {
  message: ChatMessage;
  index: number;
}

const ACTION_COLORS: Record<string, string> = {
  send: 'from-blue-500 to-indigo-600',
  balance: 'from-emerald-500 to-teal-600',
  history: 'from-violet-500 to-purple-600',
  schedule: 'from-orange-500 to-amber-600',
  stats: 'from-pink-500 to-rose-600',
  help: 'from-cyan-500 to-blue-600',
  unknown: 'from-slate-400 to-slate-600',
};

const ACTION_LABELS: Record<string, string> = {
  send: '💸 Send',
  balance: '💰 Balance',
  history: '📜 History',
  schedule: '⏰ Schedule',
  stats: '📊 Stats',
  help: '❓ Help',
  unknown: '🤔 Unknown',
};

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-slate-100 text-blue-700 font-mono text-xs">$1</code>')
    .replace(/\n/g, '<br />');
}

export default function AgentResponse({ message, index }: AgentResponseProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
          isUser
            ? 'bg-gradient-to-br from-slate-600 to-slate-800'
            : 'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </motion.div>

      {/* Bubble */}
      <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Action badge */}
        {!isUser && message.action && message.action.action !== 'unknown' && (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${
              ACTION_COLORS[message.action.action] || ACTION_COLORS.unknown
            } shadow-sm`}
          >
            <Zap className="w-3 h-3" />
            {ACTION_LABELS[message.action.action]}
          </div>
        )}

        {/* Main bubble */}
        <div
          className={`px-4 py-3 rounded-3xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'rounded-tr-lg text-white'
              : 'rounded-tl-lg bg-white/90 backdrop-blur-sm border border-slate-100 text-slate-700'
          }`}
          style={
            isUser
              ? {
                  background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                }
              : undefined
          }
        >
          {isUser ? (
            <span>{message.content}</span>
          ) : (
            <span
              dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
            />
          )}
        </div>

        {/* Action details card */}
        {!isUser && message.action && message.action.action === 'send' && message.action.to && (
          <div className="w-full p-3 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-blue-600 font-medium">To</span>
              <span className="font-mono text-blue-800 font-semibold">
                {truncateAddress(message.action.to)}
              </span>
            </div>
            {message.action.amount && (
              <div className="flex justify-between text-xs">
                <span className="text-blue-600 font-medium">Amount</span>
                <span className="font-bold text-blue-800">
                  {message.action.amount} <span className="text-purple-600">zkLTC</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Schedule card */}
        {!isUser && message.action?.action === 'schedule' && (
          <div className="w-full p-3 rounded-2xl bg-orange-50/80 border border-orange-200 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-semibold text-orange-700">
                {message.action.schedule || 'Scheduled task'}
              </span>
            </div>
          </div>
        )}

        {/* TX result */}
        {!isUser && message.txHash && (
          <div
            className={`w-full p-3 rounded-2xl border space-y-2 ${
              message.status === 'confirmed'
                ? 'bg-green-50 border-green-200'
                : message.status === 'failed'
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.status === 'confirmed' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : message.status === 'failed' ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-xs font-semibold capitalize" style={{ color: message.status === 'confirmed' ? '#16a34a' : message.status === 'failed' ? '#dc2626' : '#d97706' }}>
                {message.status === 'confirmed' ? 'Confirmed' : message.status === 'failed' ? 'Failed' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-mono text-slate-600 truncate flex-1">
                {message.txHash.slice(0, 18)}...{message.txHash.slice(-6)}
              </span>
              <a
                href={`${LITVM_CHAIN.explorerUrl}/tx/${message.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-500 hover:text-blue-700" />
              </a>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-xs text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}
