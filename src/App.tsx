import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import History from './pages/History';
import Automations from './pages/Automations';
import Settings from './pages/Settings';
import { WalletProvider } from './components/WalletContext';
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -2 }}>
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 15%, #f8fafc 35%, #faf5ff 55%, #f0fdf4 75%, #fffbeb 90%, #f0f9ff 100%)',
        }}
      />

      {/* Floating orbs */}
      <motion.div
        animate={{
          x: [0, 80, -30, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.06) 50%, transparent 75%)',
        }}
      />
      <motion.div
        animate={{
          x: [0, -60, 40, 0],
          y: [0, 70, -30, 0],
          scale: [1, 0.9, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(6,182,212,0.06) 50%, transparent 75%)',
        }}
      />
      <motion.div
        animate={{
          x: [0, 50, -20, 0],
          y: [0, -40, 60, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 10 }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, rgba(59,130,246,0.04) 50%, transparent 70%)',
        }}
      />

      {/* Mesh grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.sin(i) * 20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 4 + i * 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.7,
          }}
          className="absolute rounded-full"
          style={{
            width: `${4 + i * 2}px`,
            height: `${4 + i * 2}px`,
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
            background:
              i % 3 === 0
                ? 'rgba(59,130,246,0.4)'
                : i % 3 === 1
                ? 'rgba(139,92,246,0.4)'
                : 'rgba(6,182,212,0.4)',
            boxShadow:
              i % 3 === 0
                ? '0 0 10px rgba(59,130,246,0.3)'
                : i % 3 === 1
                ? '0 0 10px rgba(139,92,246,0.3)'
                : '0 0 10px rgba(6,182,212,0.3)',
          }}
        />
      ))}

      {/* LitVM branding subtle pattern */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/4 right-1/4 w-64 h-64 opacity-[0.03]"
        style={{
          backgroundImage: `
            repeating-conic-gradient(rgba(59,130,246,1) 0% 25%, transparent 0% 50%)
          `,
          backgroundSize: '20px 20px',
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <WalletProvider>
      <AnimatedBackground />
      <div className="min-h-screen relative">
        <Navbar />
        <main className="relative" style={{ fontFamily: 'Inter, sans-serif' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
      </WalletProvider>
    </Router>
  );
}
