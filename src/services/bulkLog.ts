export interface BulkLogRecipient {
  address: string;
  amount: string;
}

export interface BulkLogRecord {
  id: string;
  sender: string;
  label: string;
  recipients: BulkLogRecipient[];
  hash: string;
  timestamp: number;
}

export async function logBulkPayout(
  sender: string,
  label: string,
  recipients: BulkLogRecipient[],
  hash: string
): Promise<void> {
  try {
    await fetch('/api/bulkLog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, label, recipients, hash }),
    });
  } catch (e) {
    console.error('logBulkPayout error:', e);
  }
}

export async function getBulkLogsBySender(sender: string): Promise<BulkLogRecord[]> {
  try {
    const res = await fetch(`/api/bulkLog?sender=${sender}`);
    const data = await res.json();
    return data.success ? data.records : [];
  } catch {
    return [];
  }
}

export async function getBulkLogsByRecipient(recipient: string): Promise<BulkLogRecord[]> {
  try {
    const res = await fetch(`/api/bulkLog?recipient=${recipient}`);
    const data = await res.json();
    return data.success ? data.records : [];
  } catch {
    return [];
  }
}