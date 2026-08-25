import { CLAUDE_API_URL, CLAUDE_MODEL, GROQ_API_KEY } from '../config/constants';

export interface SplitRecipient {
  address: string;
  amount: string | null;
}

export interface AgentAction {
  action: 'send' | 'balance' | 'history' | 'schedule' | 'stats' | 'help' | 'split' | 'bulk' | 'reminder' | 'unknown';
  to: string | null;
  amount: string | null;
  schedule: string | null;
  scheduleMs: number | null;
  recipients: SplitRecipient[] | null;
  message: string;
  error: string | null;
}

const AGENT_SYSTEM_PROMPT = `You are LitAgent, a friendly and intelligent zkLTC wallet assistant on LitVM LiteForge Testnet (powered by Litecoin). You understand natural conversation, slang, and wallet commands in any language.

Parse ANY user message and return ONLY valid JSON. Be smart about intent. Never return plain text.

ACTION RULES (pick the best match):
- "send", "transfer", "pay", "give", "wire" → "send"
- "split", "split bill", "request payment", "request from", "collect from", "divide between" → "split"
- "bulk", "bulk payout", "bulk payment", "send to multiple", "pay everyone", "send to each", "payroll" → "bulk"
- "remind me", "reminder", "nag me", "don't let me forget" → "reminder"
- "every", "daily", "weekly", "monthly", "recurring", "repeat", "schedule", "automate", "set up payment" → "schedule"
- "balance", "how much", "wallet", "funds", "money", "rich", "broke", "account" → "balance"
- "history", "transactions", "past", "previous", "sent", "received", "activity", "log" → "history"
- "stats", "spending", "analysis", "analytics", "summary", "how much did i", "how many jobs", "my schedules", "job status", "how many payments", "active jobs", "completed", "cancelled" → "stats"
- "help", "what can you do", "commands", "features", "hi", "hello", "hey", "sup", "yo", "what is" → "help"
- Anything unclear → "help"

AMOUNT RULE: Extract number only. "0.1 zkLTC" → "0.1". Never include units.

SPLIT RULE: If action is "split", extract any real 0x wallet addresses mentioned into "recipients" as [{ "address": "0x...", "amount": "0.05" or null }]. If the message names recipients without real addresses ("wallet A", "wallet B", a person's name), still set action to "split" but return "recipients": [] — the user will fill addresses in manually. If amounts per recipient aren't specified, leave each "amount" as null (equal split assumed).

REMINDER RULE: If action is "reminder", extract a real 0x address into "to" and a number into "amount" if mentioned in the message, exactly like the send rule. If no address/amount is mentioned, leave both null — the user will fill them in the form.

Response format:
{
  "action": "send"|"balance"|"history"|"schedule"|"stats"|"help"|"split"|"bulk"|"reminder"|"unknown",
  "to": "0x address or null",
  "amount": "total number only or null",
  "schedule": "human description or null",
  "scheduleMs": null,
  "recipients": [{ "address": "0x... or empty string", "amount": "number or null" }] or null,
  "message": "friendly 1-2 sentence response explaining what you understood",
  "error": null
}`;

async function callGroq(prompt: string, maxTokens = 512): Promise<string> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Groq API error');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '{}';
}

export async function parseUserIntent(
  userMessage: string,
  _apiKey: string,
  walletAddress?: string,
  balance?: string
): Promise<AgentAction> {
  const prompt = `${AGENT_SYSTEM_PROMPT}

${walletAddress ? `Wallet: ${walletAddress}` : ''}
${balance ? `Balance: ${balance} zkLTC` : ''}

User: "${userMessage}"`;

  try {
    const text = await callGroq(prompt, 512);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]) as AgentAction;
  } catch (error: any) {
    return {
      action: 'unknown',
      to: null,
      amount: null,
      schedule: null,
      scheduleMs: null,
      recipients: null,
      message: `Error: ${error.message}`,
      error: error.message,
    };
  }
}

export async function generateSpendingStats(
  transactions: any[],
  _apiKey: string,
  walletAddress: string
): Promise<string> {
  const txSummary = transactions
    .slice(0, 30)
    .map((tx) =>
      `${tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleDateString() : 'Unknown'}: ${tx.value} zkLTC ${
        tx.from?.toLowerCase() === walletAddress?.toLowerCase()
          ? '→ sent to ' + tx.to
          : '← received from ' + tx.from
      }`
    )
    .join('\n');

  try {
    return await callGroq(
      `Summarize these zkLTC transactions in 3-4 sentences. Be friendly and concise.\n\n${txSummary || 'No transactions yet.'}`,
      400
    );
  } catch (error: any) {
    return `Could not generate summary: ${error.message}`;
  }
}