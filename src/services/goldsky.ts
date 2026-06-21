// Goldsky GraphQL service for on-chain data
// Falls back to RPC-based history if Goldsky subgraph not yet deployed for LitVM
import { GOLDSKY_ENDPOINT } from '../config/constants';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  status?: string;
}

const TRANSACTIONS_QUERY = `
  query GetTransactions($address: String!, $first: Int!) {
    transactions(
      where: { or: [{ from: $address }, { to: $address }] }
      orderBy: timestamp
      orderDirection: desc
      first: $first
    ) {
      id
      hash
      from
      to
      value
      timestamp
      blockNumber
      status
    }
  }
`;

export async function fetchTransactionsFromGoldsky(
  address: string,
  count = 20
): Promise<Transaction[]> {
  try {
    const response = await fetch(GOLDSKY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: TRANSACTIONS_QUERY,
        variables: { address: address.toLowerCase(), first: count },
      }),
    });

    if (!response.ok) throw new Error('Goldsky request failed');
    const { data, errors } = await response.json();
    if (errors || !data?.transactions) throw new Error('No data from Goldsky');

    return data.transactions.map((tx: any) => ({
      hash: tx.hash || tx.id,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      timestamp: parseInt(tx.timestamp),
      blockNumber: parseInt(tx.blockNumber),
      status: tx.status || 'confirmed',
    }));
  } catch (error) {
    console.warn('Goldsky unavailable, using RPC fallback:', error);
    return [];
  }
}

export function computeSpendingStats(
  transactions: Transaction[],
  address: string
): {
  totalSent: number;
  totalReceived: number;
  txCount: number;
  sentCount: number;
  receivedCount: number;
  topRecipients: { address: string; total: number }[];
  monthlyData: { month: string; sent: number; received: number }[];
} {
  const lowerAddr = address.toLowerCase();
  let totalSent = 0;
  let totalReceived = 0;
  let sentCount = 0;
  let receivedCount = 0;
  const recipientMap: Record<string, number> = {};
  const monthlyMap: Record<string, { sent: number; received: number }> = {};

  for (const tx of transactions) {
    const val = parseFloat(tx.value) || 0;
    const isSent = tx.from?.toLowerCase() === lowerAddr;
    const isReceived = tx.to?.toLowerCase() === lowerAddr;

    // Monthly aggregation
    const date = tx.timestamp ? new Date(tx.timestamp * 1000) : new Date();
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { sent: 0, received: 0 };

    if (isSent) {
      totalSent += val;
      sentCount++;
      monthlyMap[monthKey].sent += val;
      if (tx.to) {
        recipientMap[tx.to] = (recipientMap[tx.to] || 0) + val;
      }
    }
    if (isReceived) {
      totalReceived += val;
      receivedCount++;
      monthlyMap[monthKey].received += val;
    }
  }

  const topRecipients = Object.entries(recipientMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([address, total]) => ({ address, total }));

  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      month,
      sent: parseFloat(data.sent.toFixed(4)),
      received: parseFloat(data.received.toFixed(4)),
    }));

  return {
    totalSent: parseFloat(totalSent.toFixed(4)),
    totalReceived: parseFloat(totalReceived.toFixed(4)),
    txCount: transactions.length,
    sentCount,
    receivedCount,
    topRecipients,
    monthlyData,
  };
}
