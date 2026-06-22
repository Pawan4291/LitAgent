
import { useState, useEffect, useCallback, useRef } from 'react';
import { getBalance, switchToLitVM, registerWallet } from '../services/ethers';
import { LITVM_CHAIN } from '../config/litvm';

export interface WalletState {
  account: string | null;
  chainId: string | null;
  balance: string;
  isConnected: boolean;
  isCorrectChain: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    account: null,
    chainId: null,
    balance: '0',
    isConnected: false,
    isCorrectChain: false,
    isConnecting: false,
    error: null,
  });

  const lastBalanceFetch = useRef<number>(0);

const updateBalance = useCallback(async (address: string) => {
  const now = Date.now();
  if (now - lastBalanceFetch.current < 30000) return; // 30 sec throttle
  lastBalanceFetch.current = now;
  const bal = await getBalance(address);
  setState((prev) => ({ ...prev, balance: bal }));
}, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState((prev) => ({
        ...prev,
        error: 'MetaMask not found. Please install MetaMask.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const account = accounts[0];
      const isCorrectChain = chainId === LITVM_CHAIN.chainId;

      setState((prev) => ({
        ...prev,
        account,
        chainId,
        isConnected: true,
        isCorrectChain,
        isConnecting: false,
      }));

      await updateBalance(account);
      await updateBalance(account);
await registerWallet(account); // ← add here

      // Auto-switch if wrong chain
      if (!isCorrectChain) {
        await switchToLitVM();
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Connection failed',
      }));
    }
  }, [updateBalance]);

  const disconnect = useCallback(() => {
    setState({
      account: null,
      chainId: null,
      balance: '0',
      isConnected: false,
      isCorrectChain: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  const refreshBalance = useCallback(async () => {
    if (state.account) {
      await updateBalance(state.account);
    }
  }, [state.account, updateBalance]);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState((prev) => ({ ...prev, account: accounts[0] }));
        updateBalance(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setState((prev) => ({
        ...prev,
        chainId,
        isCorrectChain: chainId === LITVM_CHAIN.chainId,
      }));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check if already connected
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then(async (accounts: string[]) => {
        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setState((prev) => ({
            ...prev,
            account: accounts[0],
            chainId,
            isConnected: true,
            isCorrectChain: chainId === LITVM_CHAIN.chainId,
          }));
          updateBalance(accounts[0]);
        }
      })
      .catch(() => {});

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect, updateBalance]);

  return { ...state, connect, disconnect, refreshBalance };
}
