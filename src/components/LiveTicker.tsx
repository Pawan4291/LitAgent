import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TickerItem {
  label: string;
  value: string;
  color: string;
}

export default function LiveTicker() {
  const [blockNum, setBlockNum] = useState<number | null>(null);
  const [gasPrice, setGasPrice] = useState<string>('~0.001');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { ethers } = await import('ethers');
        const provider = new ethers.JsonRpcProvider('https://liteforge.rpc.caldera.xyz/http');
        const block = await provider.getBlockNumber();
        setBlockNum(block);
        const fee = await provider.getFeeData();
        if (fee.gasPrice) {
          setGasPrice(parseFloat(ethers.formatUnits(fee.gasPrice, 'gwei')).toFixed(4));
        }
      } catch {}
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const items: TickerItem[] = [
    { label: '⛓ Network', value: 'LitVM LiteForge', color: '#3b82f6' },
    { label: '🔗 Chain ID', value: '4441', color: '#8b5cf6' },
    { label: '⛽ Gas Token', value: 'zkLTC', color: '#06b6d4' },
    { label: '📦 Block', value: blockNum ? `#${blockNum.toLocaleString()}` : 'Loading...', color: '#10b981' },
    { label: '💨 Gas Price', value: `${gasPrice} Gwei`, color: '#f59e0b' },
    { label: '⚡ Powered by', value: 'Arbitrum Orbit + BitcoinOS', color: '#ec4899' },
    { label: '🔒 Settlement', value: 'Litecoin L1', color: '#84cc16' },
    { label: '🤖 AI Model', value: 'Claude 3.5 Haiku', color: '#a78bfa' },
    { label: '🚀 Status', value: 'Testnet Live', color: '#22c55e' },
  ];

  const repeated = [...items, ...items, ...items];

  return (
    <div
      className="relative overflow-hidden border-b"
      style={{
        background: 'linear-gradient(90deg, rgba(15,23,42,0.97) 0%, rgba(30,27,75,0.97) 50%, rgba(15,23,42,0.97) 100%)',
        borderColor: 'rgba(59,130,246,0.2)',
        height: '36px',
      }}
    >
      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59,130,246,0.1) 2px, rgba(59,130,246,0.1) 4px)',
        }}
      />

      {/* Left gradient fade */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(15,23,42,1) 0%, transparent 100%)' }}
      />
      {/* Right gradient fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(270deg, rgba(15,23,42,1) 0%, transparent 100%)' }}
      />

      <motion.div
        animate={{ x: [0, -(items.length * 220)] }}
        transition={{ duration: items.length * 5, repeat: Infinity, ease: 'linear' }}
        className="flex items-center h-full gap-0"
        style={{ width: 'max-content' }}
      >
        {repeated.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-6 h-full border-r"
            style={{ borderColor: 'rgba(59,130,246,0.1)', minWidth: '220px' }}
          >
            <span className="text-xs font-medium" style={{ color: 'rgba(148,163,184,0.7)' }}>
              {item.label}
            </span>
            <span
              className="text-xs font-bold font-mono"
              style={{ color: item.color }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Live indicator */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
          style={{ boxShadow: '0 0 6px #22c55e' }}
        />
        <span className="text-xs font-bold text-emerald-400">LIVE</span>
      </div>
    </div>
  );
}
