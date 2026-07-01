import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Shield, Clock, BarChart3, ArrowRight, Bot, Sparkles, Send, Brain } from 'lucide-react';

const ROTATING_WORDS = ['Send zkLTC', 'Schedule Payments', 'Analyze Spending', 'Automate Transfers', 'Check Balance'];

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Intent',
    desc: 'Just type naturally. "Send 0.1 zkLTC to 0x742d..." and LitAgent understands, parses, and executes.',
    color: '#3b82f6',
    bg: 'from-blue-50 to-blue-100/50',
    border: 'border-blue-200',
  },
  {
    icon: Send,
    title: 'Real Transactions',
    desc: 'Not a simulation. Every send hits the LitVM LiteForge testnet via MetaMask. You always sign.',
    color: '#8b5cf6',
    bg: 'from-purple-50 to-purple-100/50',
    border: 'border-purple-200',
  },
  {
    icon: Clock,
    title: 'On-Chain Scheduler',
    desc: 'Lock funds in a smart contract. Automate recurring payments — daily, weekly, monthly.',
    color: '#06b6d4',
    bg: 'from-cyan-50 to-cyan-100/50',
    border: 'border-cyan-200',
  },
  {
    icon: BarChart3,
    title: 'AI Spending Stats',
    desc: 'Claude analyzes your transaction history and gives you human-readable insights.',
    color: '#10b981',
    bg: 'from-emerald-50 to-emerald-100/50',
    border: 'border-emerald-200',
  },
  {
    icon: Shield,
    title: 'Non-Custodial',
    desc: 'Your private key never leaves MetaMask. LitAgent never stores credentials.',
    color: '#f59e0b',
    bg: 'from-amber-50 to-amber-100/50',
    border: 'border-amber-200',
  },
  {
    icon: Zap,
    title: 'LitVM Native',
    desc: 'Built for LitVM LiteForge — Litecoin\'s EVM rollup. Powered by Arbitrum Orbit + BitcoinOS.',
    color: '#ec4899',
    bg: 'from-pink-50 to-pink-100/50',
    border: 'border-pink-200',
  },
];

const STEPS = [
  { num: '01', title: 'Connect Wallet', desc: 'Click Connect and approve MetaMask. LitAgent auto-switches to LitVM LiteForge testnet.' },
 { num: '02', title: 'Get Free zkLTC', desc: 'Visit the LitVM faucet at liteforge.hub.caldera.xyz and grab free testnet tokens.' },
  { num: '03', title: 'Type Naturally', desc: 'Ask anything. "What\'s my balance?", "Send 0.5 zkLTC to 0x...", "Schedule daily payments".' },
  { num: '04', title: 'Confirm & Go', desc: 'LitAgent shows you exactly what it\'s doing. You confirm. MetaMask signs. Done.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [wordIdx, setWordIdx] = useState(0);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 1]);

  useEffect(() => {
    const t = setInterval(() => setWordIdx(i => (i + 1) % ROTATING_WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>

      {/* Hero */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16 overflow-hidden"
      >
        {/* Background orbs */}
        <motion.div animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />
        <motion.div animate={{ x: [0, -40, 0], y: [0, 50, 0], scale: [1, 0.9, 1] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />
        <motion.div animate={{ x: [0, 30, 0], y: [0, -30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #eff6ff, #f0e6ff)', border: '1px solid rgba(139,92,246,0.3)', color: '#7c3aed' }}>
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Sparkles className="w-3.5 h-3.5" />
          </motion.div>
          Built on LitVM LiteForge Testnet · Powered by Groq AI
        </motion.div>

        {/* Headline */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="text-center max-w-4xl mx-auto mb-6">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Your AI Wallet<br />
            That Can{' '}
            <span className="relative inline-block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="inline-block"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  {ROTATING_WORDS[wordIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Type naturally. LitAgent understands, executes, and confirms — all on Litecoin's EVM rollup.
            No commands to memorize. Just talk to your wallet.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(59,130,246,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/app')}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-bold text-base shadow-xl"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)' }}
          >
            <Bot className="w-5 h-5" />
            Launch LitAgent
            <ArrowRight className="w-4 h-4" />
          </motion.button>
          <a href="https://github.com/Pawan4291/LitAgent" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-6 py-4 rounded-2xl font-semibold text-slate-600 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all text-sm shadow-sm">
            View on GitHub
          </a>
        </motion.div>

        {/* Floating chat demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full max-w-lg mx-auto"
        >
          <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(148,163,184,0.2)', backdropFilter: 'blur(20px)' }}>
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400 font-mono ml-2">liagent.xyz</span>
            </div>
            <div className="p-5 space-y-3">
              {[
                { role: 'user', text: 'Send 0.1 zkLTC to 0x742d35Cc6634C0532...', delay: 1.2 },
                { role: 'agent', text: '💸 Ready to send 0.1 zkLTC. Gas: ~0.000021 zkLTC. Please confirm below.', delay: 1.8 },
                { role: 'user', text: 'Schedule 0.01 zkLTC to 0x... every day', delay: 2.4 },
                { role: 'agent', text: '⏰ Scheduled! Funds locked in smart contract. 30 daily payments queued.', delay: 3.0 },
              ].map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: m.delay }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs font-medium ${m.role === 'user' ? 'text-white rounded-tr-sm' : 'text-slate-700 bg-slate-50 border border-slate-100 rounded-tl-sm'}`}
                    style={m.role === 'user' ? { background: 'linear-gradient(135deg, #334155, #1e293b)' } : {}}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <div className="w-5 h-8 rounded-full border-2 border-slate-300 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-slate-400" />
          </div>
        </motion.div>
      </motion.section>

      {/* Stats bar */}
      <section className="py-10 px-4" style={{ background: 'linear-gradient(135deg, #eff6ff, #f0e6ff, #ecfeff)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { val: '100%', label: 'Non-custodial' },
           { val: 'Groq AI', label: 'Intent parsing' },
            { val: 'LitVM', label: 'EVM Rollup' },
            { val: '∞', label: 'Automations' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <p className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.val}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">What it does</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Everything your wallet<br />should have always done
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">One chat interface to rule them all. No clicking through menus. No memorizing addresses. Just intent.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, boxShadow: `0 20px 40px ${f.color}20` }}
                className={`p-6 rounded-3xl bg-gradient-to-br ${f.bg} border ${f.border} transition-all duration-300`}
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-4" style={{ background: 'linear-gradient(180deg, #f8fafc, #eff6ff)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-3">Get started in 4 steps</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Up and running<br />in under 2 minutes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ x: 6 }}
                className="flex items-start gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-md"
              >
                <div className="text-3xl font-black flex-shrink-0" style={{ fontFamily: 'Space Grotesk, sans-serif', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.num}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section id="stack" className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <p className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-3">Tech Stack</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Real tech.<br />Nothing simulated.
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Groq AI', role: 'Intent parsing + analytics', color: '#8b5cf6' },
              { name: 'LitVM LiteForge', role: 'EVM rollup on Litecoin', color: '#3b82f6' },
              { name: 'MetaMask', role: 'Transaction signing', color: '#f59e0b' },
              { name: 'ethers.js v6', role: 'Blockchain interaction', color: '#06b6d4' },
              { name: 'Smart Contract', role: 'On-chain scheduler', color: '#10b981' },
              { name: 'React + Vite', role: 'Frontend framework', color: '#ec4899' },
            ].map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.04 }}
                className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-2 h-2 rounded-full mb-3" style={{ background: t.color }} />
                <p className="text-sm font-bold text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-400 mt-1">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl p-12 text-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0e6ff 50%, #ecfeff 100%)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent)', transform: 'translate(30%, -30%)' }} />

            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)' }}
            >
              <Bot className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Ready to talk to your wallet?
            </h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Connect MetaMask, add your Claude API key, and start transacting with plain English.
            </p>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(59,130,246,0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/app')}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-bold text-base shadow-xl"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)' }}
            >
              <Bot className="w-5 h-5" />
              Launch LitAgent
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <p className="text-xs text-slate-400 mt-4">
              Follow on{' '}
              <a href="https://x.com/litagentapp" target="_blank" rel="noreferrer" className="text-xs text-blue-500 font-semibold hover:text-blue-700 transition-colors">
  X
</a>
              {' '}· Open source on{' '}
              <a href="https://github.com/Pawan4291/LitAgent" target="_blank" rel="noreferrer" className="text-blue-500 font-semibold hover:text-blue-700">
                GitHub
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-100">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-black text-slate-700" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>LitAgent</span>
            <span className="text-xs text-slate-400">· AI Wallet on LitVM</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <a href="https://litvm.com" target="_blank" rel="noreferrer" className="hover:text-blue-500 transition-colors">LitVM</a>
            <a href="https://t.me/LitecoinVM" target="_blank" rel="noreferrer" className="hover:text-blue-500 transition-colors">Telegram</a>
            <a href="https://github.com/Pawan4291/LitAgent" target="_blank" rel="noreferrer" className="hover:text-blue-500 transition-colors">GitHub</a>
            <a href="https://x.com/litagentapp" target="_blank" rel="noreferrer" className="text-xs text-blue-500 font-semibold hover:text-blue-700 transition-colors">
  X
</a>
          </div>
        </div>
      </footer>
    </div>
  );
}