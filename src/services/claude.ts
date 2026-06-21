import { CLAUDE_API_URL, CLAUDE_MODEL, GROQ_API_KEY } from '../config/constants';

export interface AgentAction {
  action: 'send' | 'balance' | 'history' | 'schedule' | 'stats' | 'help' | 'unknown';
  to: string | null;
  amount: string | null;
  schedule: string | null;
  scheduleMs: number | null;
  message: string;
  error: string | null;
}

const AGENT_SYSTEM_PROMPT = `You are LitAgent, a zkLTC wallet assistant on LitVM. Parse user commands and return ONLY valid JSON, no other text.

Supported actions: send, balance, history, schedule, stats, help, unknown

IMPORTANT RULES:
- If message contains "every", "daily", "weekly", "monthly", "hourly", "every day", "every week", "every month", "every minute" → action MUST be "schedule"
- If message contains "in X hours/minutes" → action MUST be "schedule"  
- Only use "send" for immediate one-time transfers with no time reference

Response format:
{
  "action": "send"|"balance"|"history"|"schedule"|"stats"|"help"|"unknown",
  "to": "0x address or null",
  "amount": "number as string or null",
  "schedule": "human description or null",
  "scheduleMs": number or null,
  "message": "friendly explanation",
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