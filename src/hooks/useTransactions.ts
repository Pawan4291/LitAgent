import { useState, useCallback } from 'react';
import { fetchTransactionsFromGoldsky, Transaction } from '../services/goldsky';
import { getTransactionsByAddress } from '../services/ethers';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'goldsky' | 'rpc' | null>(null);

  const fetchTransactions = useCallback(async (address: string, count = 20) => {
    if (!address) return;
    setIsLoading(true);
    setError(null);

    try {
      // Try Goldsky first
      const goldskyTxs = await fetchTransactionsFromGoldsky(address, count);
      if (goldskyTxs.length > 0) {
        setTransactions(goldskyTxs);
        setSource('goldsky');
        setIsLoading(false);
        return;
      }

      // Fallback to RPC
      const rpcTxs = await getTransactionsByAddress(address, count);
      setTransactions(rpcTxs);
      setSource('rpc');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearTransactions = useCallback(() => {
    setTransactions([]);
    setSource(null);
    setError(null);
  }, []);

  return {
    transactions,
    isLoading,
    error,
    source,
    fetchTransactions,
    clearTransactions,
  };
}
