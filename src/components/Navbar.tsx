import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Clock, History, Settings, Zap } from 'lucide-react';
import WalletConnect from './WalletConnect';
import LiveTicker from './LiveTicker';

const NAV_ITEMS = [
  { to: '/', label: 'Chat', icon: MessageSquare },
  { to: '/history', label: 'History', icon: History },
  { to: '/automations', label: 'Automate', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 w-full">
      <LiveTicker />
      <div
        className="mx-auto flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148,163,184,0.15)',
          boxShadow: '0 1px 30px rgba(59,130,246,0.08)',
        }}
      >
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
            }}
          >
            <Zap className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <span className="text-lg font-black tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Lit
              </span>
              <span className="text-slate-800">Agent</span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5 leading-none hidden sm:block">
              Powered by LitVM
            </p>
          </div>
        </NavLink>

        {/* Nav links - desktop */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navActive"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>

        {/* Wallet */}
        <WalletConnect />
      </div>

      {/* Mobile bottom nav */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(148,163,184,0.15)',
          boxShadow: '0 -4px 20px rgba(59,130,246,0.1)',
        }}
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobileNavDot"
                    className="w-1 h-1 rounded-full bg-blue-500"
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
