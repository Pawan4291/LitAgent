export interface SplitRecipientRecord {
  address: string;
  amount: string;
  paid: boolean;
  txHash: string | null;
}

export interface SplitRequestRecord {
  id: string;
  creator: string;
  description: string;
  token: string;
  recipients: SplitRecipientRecord[];
  deadline: string | null;
  createdAt: number;
}

export async function createSplitRequest(
  creator: string,
  description: string,
  recipients: { address: string; amount: string }[],
  deadline: string | null,
  token = 'zkLTC'
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
   const res = await fetch(`/api/splitRequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator, description, token, recipients, deadline }),
    });
    const data = await res.json();
    if (!data.success) return { success: false, error: data.error || 'Failed to create split' };
    return { success: true, id: data.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function markSplitPaid(
  id: string,
  address: string,
  txHash: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/splitRequest`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, address, txHash }),
    });
    const data = await res.json();
    return data.success ? { success: true } : { success: false, error: data.error };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getSplitRequest(id: string): Promise<SplitRequestRecord | null> {
  try {
    const res = await fetch(`/api/splitRequest?id=${id}`);
    const data = await res.json();
    return data.success ? data.record : null;
  } catch {
    return null;
  }
}

export async function getSplitsForRecipient(recipient: string): Promise<SplitRequestRecord[]> {
  try {
    const res = await fetch(`/api/splitRequest?recipient=${recipient}`);
    const data = await res.json();
    return data.success ? data.records : [];
  } catch {
    return [];
  }
}

export async function getSplitsByCreator(creator: string): Promise<SplitRequestRecord[]> {
  try {
    const res = await fetch(`/api/splitRequest?creator=${creator}`);
    const data = await res.json();
    return data.success ? data.records : [];
  } catch {
    return [];
  }
}