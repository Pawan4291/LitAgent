export interface ReminderRecord {
  id: string;
  owner: string;
  label: string;
  to: string | null;
  amount: string | null;
  intervalMs: number;
  nextDue: number;
  active: boolean;
  createdAt: number;
}

export async function createReminder(
  owner: string,
  label: string,
  to: string | null,
  amount: string | null,
  startAt: number,
  intervalMs: number
): Promise<boolean> {
  try {
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, label, to, amount, startAt, intervalMs }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function getReminders(owner: string): Promise<ReminderRecord[]> {
  try {
    const res = await fetch(`/api/reminders?owner=${owner}`);
    const data = await res.json();
    return data.success ? data.records : [];
  } catch {
    return [];
  }
}

export async function deleteReminder(owner: string, id: string): Promise<boolean> {
  try {
    const res = await fetch('/api/reminders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, id }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function snoozeReminder(owner: string, id: string): Promise<boolean> {
  try {
    const res = await fetch('/api/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, id }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}