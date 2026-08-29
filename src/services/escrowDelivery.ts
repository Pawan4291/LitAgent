export interface EscrowDeliveryRecord {
  id: string;
  seller: string;
  buyer: string;
  note: string;
  label: string;
  submittedAt: number;
}

export async function submitDelivery(seller: string, buyer: string, note: string, label: string): Promise<boolean> {
  try {
    const res = await fetch('/api/escrowDelivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seller, buyer, note, label }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function getDeliveriesForBuyer(buyer: string): Promise<EscrowDeliveryRecord[]> {
  try {
    const res = await fetch(`/api/escrowDelivery?buyer=${buyer}`);
    const data = await res.json();
    return data.success ? data.records : [];
  } catch {
    return [];
  }
}