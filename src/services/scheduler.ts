import { STORAGE_KEYS } from '../config/constants';

export interface ScheduledJob {
  id: string;
  label: string;
  to: string;
  amount: string;
  schedule: string;
  nextRunMs: number;
  intervalMs: number | null; // null = one-time
  createdAt: number;
  lastRun: number | null;
  runCount: number;
  active: boolean;
}

export function parseScheduleToMs(scheduleText: string | null, scheduleMs?: number | null): number | null {
  if (scheduleMs) return scheduleMs;
  if (!scheduleText) return null;

  const lower = scheduleText.toLowerCase();

  // Minutes
  if (lower.includes('every minute')) return 60 * 1000;
  if (lower.includes('every 2 min')) return 2 * 60 * 1000;
  if (lower.includes('every 3 min')) return 3 * 60 * 1000;
  if (lower.includes('every 5 min')) return 5 * 60 * 1000;
  if (lower.includes('every 10 min')) return 10 * 60 * 1000;
  if (lower.includes('every 15 min')) return 15 * 60 * 1000;
  if (lower.includes('every 30 min')) return 30 * 60 * 1000;

  // Hours
  if (lower.includes('every hour') || lower.includes('hourly')) return 60 * 60 * 1000;
  if (lower.includes('every 2 hour')) return 2 * 60 * 60 * 1000;
  if (lower.includes('every 3 hour')) return 3 * 60 * 60 * 1000;
  if (lower.includes('every 6 hour')) return 6 * 60 * 60 * 1000;
  if (lower.includes('every 12 hour')) return 12 * 60 * 60 * 1000;

  // One-time delays
  if (lower.includes('in 1 hour') || lower.includes('in an hour')) return 60 * 60 * 1000;
  if (lower.includes('in 2 hour')) return 2 * 60 * 60 * 1000;
  if (lower.includes('in 6 hour')) return 6 * 60 * 60 * 1000;
  if (lower.includes('tomorrow')) return 24 * 60 * 60 * 1000;

  // Days
  if (lower.includes('every day') || lower.includes('daily')) return 24 * 60 * 60 * 1000;
  if (lower.includes('every 2 day')) return 2 * 24 * 60 * 60 * 1000;
  if (lower.includes('every 3 day')) return 3 * 24 * 60 * 60 * 1000;

  // Weeks
  if (lower.includes('every week') || lower.includes('weekly')) return 7 * 24 * 60 * 60 * 1000;
  if (lower.includes('every 2 week') || lower.includes('fortnightly')) return 14 * 24 * 60 * 60 * 1000;

  // Months
  if (lower.includes('every month') || lower.includes('monthly')) return 30 * 24 * 60 * 60 * 1000;
  if (lower.includes('every 3 month') || lower.includes('quarterly')) return 90 * 24 * 60 * 60 * 1000;
  if (lower.includes('every 6 month')) return 180 * 24 * 60 * 60 * 1000;

  // Years
  if (lower.includes('every year') || lower.includes('yearly') || lower.includes('annually')) return 365 * 24 * 60 * 60 * 1000;

  return null;
}

export function isRecurring(scheduleText: string): boolean {
  const lower = scheduleText.toLowerCase();
  return lower.includes('every') || lower.includes('daily') || lower.includes('weekly') || lower.includes('monthly') || lower.includes('hourly');
}

export function loadJobs(): ScheduledJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULED_JOBS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveJobs(jobs: ScheduledJob[]): void {
  localStorage.setItem(STORAGE_KEYS.SCHEDULED_JOBS, JSON.stringify(jobs));
}

export function addJob(job: Omit<ScheduledJob, 'id' | 'createdAt' | 'lastRun' | 'runCount'>): ScheduledJob {
  const jobs = loadJobs();
  const newJob: ScheduledJob = {
    ...job,
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    lastRun: null,
    runCount: 0,
  };
  jobs.push(newJob);
  saveJobs(jobs);
  return newJob;
}

export function deleteJob(id: string): void {
  const jobs = loadJobs().filter((j) => j.id !== id);
  saveJobs(jobs);
}

export function toggleJob(id: string): void {
  const jobs = loadJobs().map((j) =>
    j.id === id ? { ...j, active: !j.active } : j
  );
  saveJobs(jobs);
}

export function getDueJobs(): ScheduledJob[] {
  const now = Date.now();
  return loadJobs().filter((j) => j.active && j.nextRunMs <= now);
}

export function markJobRan(id: string): void {
  const jobs = loadJobs().map((j) => {
    if (j.id !== id) return j;
    const ran: ScheduledJob = {
      ...j,
      lastRun: Date.now(),
      runCount: j.runCount + 1,
    };
    // If recurring, set next run; otherwise deactivate
    if (j.intervalMs) {
      ran.nextRunMs = Date.now() + j.intervalMs;
    } else {
      ran.active = false;
    }
    return ran;
  });
  saveJobs(jobs);
}

export function formatNextRun(ms: number): string {
  const diff = ms - Date.now();
  if (diff <= 0) return 'Due now';
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `in ${days}d ${hours % 24}h`;
  if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `in ${minutes}m`;
  return `in ${seconds}s`;
}
