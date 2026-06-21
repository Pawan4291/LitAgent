import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Trash2, Save, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { STORAGE_KEYS, DEFAULT_DAILY_LIMIT, MAX_DAILY_SEND_LIMIT } from '../config/constants';
import { isValidAddress } from '../services/ethers';

interface Settings {
  dailyLimit: number;
  whitelist: string[];
 
  requireConfirm: boolean;
}

export default function SafetySettings() {
  const [settings, setSettings] = useState<Settings>({
    dailyLimit: DEFAULT_DAILY_LIMIT,
    whitelist: [],
   
    requireConfirm: true,
  });
  const [newAddress, setNewAddress] = useState('');
  const [saved, setSaved] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) setSettings(JSON.parse(raw));
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addToWhitelist = () => {
    if (!newAddress.trim()) return;
    if (!isValidAddress(newAddress.trim())) {
      setAddressError('Invalid Ethereum address');
      return;
    }
    if (settings.whitelist.includes(newAddress.toLowerCase())) {
      setAddressError('Already in whitelist');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      whitelist: [...prev.whitelist, newAddress.toLowerCase()],
    }));
    setNewAddress('');
    setAddressError('');
  };

  const removeFromWhitelist = (addr: string) => {
    setSettings((prev) => ({
      ...prev,
      whitelist: prev.whitelist.filter((a) => a !== addr),
    }));
  };

  return (
    <div className="space-y-6">

      {/* Daily Limit */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl bg-white/80 border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Daily Send Limit</h3>
            <p className="text-xs text-slate-500">Max zkLTC you can send per day</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0.01}
              max={MAX_DAILY_SEND_LIMIT}
              step={0.01}
              value={settings.dailyLimit}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, dailyLimit: parseFloat(e.target.value) }))
              }
              className="flex-1 accent-blue-500"
            />
            <div className="flex items-center gap-1.5 min-w-[120px]">
              <input
                type="number"
                min={0.001}
                max={MAX_DAILY_SEND_LIMIT}
                step={0.001}
                value={settings.dailyLimit}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    dailyLimit: Math.min(MAX_DAILY_SEND_LIMIT, parseFloat(e.target.value) || 0),
                  }))
                }
                className="w-20 px-3 py-2 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-blue-600 text-center focus:outline-none focus:border-blue-400"
              />
              <span className="text-xs font-semibold text-purple-600">zkLTC</span>
            </div>
          </div>

          <div className="flex gap-2">
            {[0.1, 0.5, 1, 5].map((v) => (
              <button
                key={v}
                onClick={() => setSettings((prev) => ({ ...prev, dailyLimit: v }))}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  settings.dailyLimit === v
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Confirm Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-5 rounded-2xl bg-white/80 border border-slate-200 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Require Confirmation</h3>
              <p className="text-xs text-slate-500">Show confirm modal before sending</p>
            </div>
          </div>
          <button
            onClick={() => setSettings((prev) => ({ ...prev, requireConfirm: !prev.requireConfirm }))}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
              settings.requireConfirm ? 'bg-blue-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                settings.requireConfirm ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </motion.div>

      {/* Whitelist */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-5 rounded-2xl bg-white/80 border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Trusted Addresses</h3>
            <p className="text-xs text-slate-500">Whitelist for quick sends</p>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newAddress}
            onChange={(e) => { setNewAddress(e.target.value); setAddressError(''); }}
            placeholder="0x... address"
            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white/80 text-xs font-mono focus:outline-none focus:border-blue-400 transition-colors"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addToWhitelist}
            className="px-3 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        {addressError && (
          <p className="text-xs text-red-500 mb-2">{addressError}</p>
        )}

        <div className="space-y-2">
          {settings.whitelist.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">No trusted addresses yet</p>
          ) : (
            settings.whitelist.map((addr) => (
              <div
                key={addr}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200"
              >
                <span className="text-xs font-mono text-slate-700 truncate">{addr}</span>
                <button
                  onClick={() => removeFromWhitelist(addr)}
                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Save button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={save}
        className="w-full py-3.5 rounded-2xl font-bold text-white text-sm shadow-lg transition-all relative overflow-hidden"
        style={{
          background: saved
            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
        }}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Saved!
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Save Settings
          </span>
        )}
      </motion.button>
    </div>
  );
}
