import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, Play, Pause, Repeat, Calendar, Zap } from 'lucide-react';
import { ScheduledJob, deleteJob, toggleJob, formatNextRun } from '../services/scheduler';
import { truncateAddress } from '../services/ethers';

interface AutomationListProps {
  jobs: ScheduledJob[];
  onUpdate: () => void;
  compact?: boolean;
}

export default function AutomationList({ jobs, onUpdate, compact = false }: AutomationListProps) {
  const handleDelete = (id: string) => {
    deleteJob(id);
    onUpdate();
  };

  const handleToggle = (id: string) => {
    toggleJob(id);
    onUpdate();
  };

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 flex items-center justify-center">
          <Clock className="w-7 h-7 text-orange-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-600">No automations set</p>
          <p className="text-xs text-slate-400 mt-1">
            Say "Send 0.01 zkLTC to 0x... every day" to schedule
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            {jobs.length} Automation{jobs.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-slate-400">
            {jobs.filter((j) => j.active).length} active
          </span>
        </div>
      )}

      <AnimatePresence>
        {jobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-2xl border transition-all duration-200 ${
              job.active
                ? 'bg-white/90 border-orange-200 shadow-md'
                : 'bg-slate-50/80 border-slate-200 opacity-70'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: Info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    job.active
                      ? 'bg-gradient-to-br from-orange-100 to-amber-100'
                      : 'bg-slate-100'
                  }`}
                >
                  {job.intervalMs ? (
                    <Repeat className={`w-5 h-5 ${job.active ? 'text-orange-500' : 'text-slate-400'}`} />
                  ) : (
                    <Calendar className={`w-5 h-5 ${job.active ? 'text-orange-500' : 'text-slate-400'}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{job.label}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-mono">
                      → {truncateAddress(job.to)}
                    </span>
                    <span className="text-xs font-bold text-blue-600">
                      {job.amount} <span className="text-purple-600">zkLTC</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {job.active ? formatNextRun(job.nextRunMs) : 'Paused'}
                      </span>
                    </div>
                    {job.runCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-emerald-600">
                          {job.runCount}x run
                        </span>
                      </div>
                    )}
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                      {job.schedule}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleToggle(job.id)}
                  className={`p-2 rounded-xl transition-colors ${
                    job.active
                      ? 'hover:bg-amber-100 text-amber-600'
                      : 'hover:bg-emerald-100 text-emerald-600'
                  }`}
                  title={job.active ? 'Pause' : 'Resume'}
                >
                  {job.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(job.id)}
                  className="p-2 rounded-xl hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
