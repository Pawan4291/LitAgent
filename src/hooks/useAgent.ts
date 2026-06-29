/// <reference types="vite/client" />
import { useState, useCallback } from 'react';
import { parseUserIntent, AgentAction } from '../services/claude';
import { STORAGE_KEYS } from '../config/constants';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  action?: AgentAction;
  timestamp: number;
  txHash?: string;
  status?: 'pending' | 'confirmed' | 'failed';
}

export function useAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isThinking, setIsThinking] = useState(false);
  const [lastAction, setLastAction] = useState<AgentAction | null>(null);

  const getApiKey = useCallback((): string => {
  return import.meta.env.VITE_GROQ_API_KEY || '';
}, []);

  const saveMessages = useCallback((msgs: ChatMessage[]) => {
    const trimmed = msgs.slice(-50); // Keep last 50
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(trimmed));
    return trimmed;
  }, []);

  const addUserMessage = useCallback(
    (content: string) => {
      const msg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => {
        const updated = [...prev, msg];
        return saveMessages(updated);
      });
      return msg;
    },
    [saveMessages]
  );

  const addAgentMessage = useCallback(
    (content: string, action?: AgentAction, txHash?: string, status?: ChatMessage['status']) => {
      const msg: ChatMessage = {
        id: `msg_${Date.now()}_agent`,
        role: 'agent',
        content,
        action,
        timestamp: Date.now(),
        txHash,
        status,
      };
      setMessages((prev) => {
        const updated = [...prev, msg];
        return saveMessages(updated);
      });
      return msg;
    },
    [saveMessages]
  );

  const processMessage = useCallback(
    
    async (userMessage: string, walletAddress?: string, balance?: string) => {
      const apiKey = getApiKey();
    
      if (!apiKey) {
        addAgentMessage(
         '⚙️ Groq API key not found. Check your .env file has VITE_GROQ_API_KEY set.',
          undefined
        );
        return null;
      }

      addUserMessage(userMessage);
      setIsThinking(true);

      try {
        const action = await parseUserIntent(userMessage, apiKey, walletAddress, balance);
        setLastAction(action);
        setIsThinking(false);
        return action;
      } catch (error: any) {
        setIsThinking(false);
        addAgentMessage(`❌ Error processing request: ${error.message}`);
        return null;
      }
    },
    [getApiKey, addUserMessage, addAgentMessage]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
  }, []);

  return {
    messages,
    isThinking,
    lastAction,
    processMessage,
    addAgentMessage,
    addUserMessage,
    clearHistory,
  };
}
