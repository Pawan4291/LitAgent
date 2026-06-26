/// <reference types="vite/client" />
export const CLAUDE_API_URL = "https://api.groq.com/openai/v1/chat/completions";
export const CLAUDE_MODEL = "llama-3.3-70b-versatile";
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

// Goldsky — fallback to RPC if subgraph not deployed
export const GOLDSKY_PROJECT_ID = "litvm-liteforge";
export const GOLDSKY_ENDPOINT = `https://api.goldsky.com/api/public/project_litvm/subgraphs/liteforge-transactions/v1/gn`;
// App limits
export const MAX_DAILY_SEND_LIMIT = 10; // zkLTC
export const DEFAULT_DAILY_LIMIT = 1; // zkLTC
export const MAX_HISTORY_ITEMS = 50;
export const SCHEDULER_CHECK_INTERVAL = 60000; // 1 minute

// Storage keys
export const STORAGE_KEYS = {
  DAILY_LIMIT: "litagent_daily_limit",
  WHITELIST: "litagent_whitelist",
  SCHEDULED_JOBS: "litagent_scheduled_jobs",
  DAILY_SENT: "litagent_daily_sent",
  CHAT_HISTORY: "litagent_chat_history",
  SETTINGS: "litagent_settings",
};

// Agent system prompt for Claude
export const AGENT_SYSTEM_PROMPT = `You are LitAgent, an intelligent zkLTC wallet assistant on the LitVM LiteForge testnet (powered by Litecoin). 

You parse user natural language commands and return ONLY a valid JSON object. Never return plain text — always JSON.

Supported actions:
- send: Transfer zkLTC to an address
- balance: Check wallet balance
- history: Show transaction history
- schedule: Schedule a future or recurring transfer
- stats: Show spending statistics/summary
- help: Show available commands
- unknown: Unrecognized command

Response format:
{
  "action": "send" | "balance" | "history" | "schedule" | "stats" | "help" | "unknown",
  "to": "0x... address or null",
  "amount": "number as string or null",
  "schedule": "cron-like string or human description or null",
  "scheduleMs": number or null (milliseconds delay for one-time schedules),
  "message": "human-friendly explanation of what you understood",
  "error": "null or error message if invalid"
}

Rules:
- For send: extract 'to' address and 'amount' in zkLTC
- For schedule: extract timing (e.g. "every day", "in 1 hour", "every monday") and transfer details
- Always acknowledge the Litecoin/zkLTC context
- Be friendly and concise in the 'message' field
- Never ask for private keys
- If amount looks too large (>100 zkLTC), warn in message field`;
