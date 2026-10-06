export interface NotifyPrefs {
  email: string | null;
  telegramChatId: string | null;
  lowBalanceThreshold: number;
}

export async function getNotifyPrefs(owner: string): Promise<NotifyPrefs> {
  try {
    const res = await fetch(`/api/notifications/register?owner=${owner}`);
    const data = await res.json();
    return data.success ? data.record : { email: null, telegramChatId: null, lowBalanceThreshold: 0 };
  } catch {
    return { email: null, telegramChatId: null, lowBalanceThreshold: 0 };
  }
}

export async function saveNotifyPrefs(
  owner: string,
  email: string | null,
  telegramChatId: string | null,
  lowBalanceThreshold: number
): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, email, telegramChatId, lowBalanceThreshold }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}