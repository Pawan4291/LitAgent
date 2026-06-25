import { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Sparkles, ChevronDown, Trash2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  isConnected?: boolean;
  onClearHistory?: () => void;
  hasMessages?: boolean;
}

const QUICK_COMMANDS = [
  { label: '💰 Check Balance', command: 'What is my current zkLTC balance?' },
  { label: '📜 View History', command: 'Show my recent transaction history' },
  { label: '📊 Spending Stats', command: 'Give me a summary of my spending stats' },
  { label: '⏰ Daily Send', command: 'Schedule daily 0.01 zkLTC send to 0x...' },
  { label: '❓ Help', command: 'What can you do?' },
];

export default function ChatInput({ onSend, isLoading, isConnected, onClearHistory, hasMessages }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick commands row */}
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={() => setShowQuick(!showQuick)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all flex-shrink-0"
        >
          <Sparkles className="w-3 h-3" />
          Quick Commands
          <ChevronDown className={`w-3 h-3 transition-transform ${showQuick ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showQuick && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex gap-2 overflow-x-auto pb-1 flex-1"
            >
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => {
                    setInput(cmd.command);
                    setShowQuick(false);
                    textareaRef.current?.focus();
                  }}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100 font-medium transition-all"
                >
                  {cmd.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear chat — same row, right side */}
        {hasMessages && onClearHistory && !showQuick && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors ml-auto flex-shrink-0"
          >
            <Trash2 className="w-3 h-3" />
            Clear chat
          </button>
        )}
      </div>

      {/* Main input */}
      <div
        className="relative flex items-end gap-3 p-3 rounded-3xl bg-white/90 backdrop-blur-xl border-2 transition-all duration-200 shadow-xl"
        style={{
          borderColor: input ? '#3b82f6' : 'transparent',
          boxShadow: input
            ? '0 8px 32px rgba(59, 130, 246, 0.15)'
            : '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !isConnected}
            placeholder={
              !isConnected
                ? '🔗 Connect your wallet to start...'
                : isLoading
                ? '🤔 LitAgent is thinking...'
                : '💬 Ask LitAgent anything — "Send 0.1 zkLTC to 0x..." or "What\'s my balance?"'
            }
            rows={1}
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm font-medium resize-none outline-none leading-relaxed"
            style={{ minHeight: '28px', maxHeight: '120px' }}
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
            title="Voice input (coming soon)"
          >
            <Mic className="w-4 h-4" />
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !isConnected}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 disabled:opacity-40"
            style={{
              background:
                input.trim() && isConnected
                  ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                  : '#e2e8f0',
              boxShadow:
                input.trim() && isConnected ? '0 4px 15px rgba(59, 130, 246, 0.4)' : 'none',
            }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Send
                className="w-4 h-4"
                style={{ color: input.trim() && isConnected ? 'white' : '#94a3b8' }}
              />
            )}
          </motion.button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-xs">Enter</kbd> to send ·{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-xs">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}