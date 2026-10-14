import { ethers } from 'ethers';

const RPC_URL = 'https://liteforge.rpc.caldera.xyz/http';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const SCHEDULER_ABI = [
  'function getHistory(address owner) view returns (tuple(uint256 jobId, uint256 timestamp, uint256 amount, address to, bool success)[])',
];
const ESCROW_ABI = [
  'function getBuyerEscrows(address _buyer) view returns (tuple(address buyer, address seller, uint256 amount, uint256 deadline, string label, uint8 status)[])',
];

async function sendEmail(to, subject, text) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: 'LitAgent <notifications@litagent.online>', to, subject, text }),
    });
  } catch (e) {
    console.error('Email send error:', e);
  }
}

async function sendTelegram(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (e) {
    console.error('Telegram send error:', e);
  }
}

async function redisGet(key) {
  const r = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  });
  const d = await r.json();
  return d.result ? JSON.parse(d.result) : null;
}

async function redisMembers(key) {
  const r = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/smembers/${key}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  });
  const d = await r.json();
  return d.result || [];
}

async function gatherStats(owner, provider) {
  const since = Date.now() - WEEK_MS;
  const stats = {
    balance: 0,
    bulkCount: 0,
    bulkTotal: 0,
    splitCount: 0,
    splitPaid: 0,
    splitPending: 0,
    scheduledRuns: 0,
    scheduledTotal: 0,
    pendingEscrows: 0,
    activeReminders: 0,
  };

  try {
    stats.balance = Number(ethers.formatEther(await provider.getBalance(owner)));
  } catch {}

  try {
    const ids = await redisMembers(`bulklog:sender:${owner}`);
    for (const id of ids) {
      const rec = await redisGet(`bulklog:${id}`);
      if (rec && rec.timestamp >= since) {
        stats.bulkCount++;
        stats.bulkTotal += rec.recipients.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
      }
    }
  } catch {}

  try {
    const ids = await redisMembers(`splits:${owner}`);
    for (const id of ids) {
      const rec = await redisGet(`split:${id}`);
      if (rec && rec.createdAt >= since) {
        stats.splitCount++;
        stats.splitPaid += rec.recipients.filter((r) => r.paid).length;
        stats.splitPending += rec.recipients.filter((r) => !r.paid).length;
      }
    }
  } catch {}

  try {
    const scheduler = new ethers.Contract(process.env.VITE_SCHEDULER_CONTRACT, SCHEDULER_ABI, provider);
    const history = await scheduler.getHistory(owner);
    for (const h of history) {
      if (Number(h.timestamp) * 1000 >= since) {
        stats.scheduledRuns++;
        stats.scheduledTotal += Number(ethers.formatEther(h.amount));
      }
    }
  } catch {}

  try {
    const escrow = new ethers.Contract(process.env.VITE_ESCROW_CONTRACT, ESCROW_ABI, provider);
    const deals = await escrow.getBuyerEscrows(owner);
    stats.pendingEscrows = deals.filter((d) => Number(d.status) === 0).length;
  } catch {}

  try {
    const ids = await redisMembers(`reminders:${owner}`);
    for (const id of ids) {
      const rec = await redisGet(`reminder:${id}`);
      if (rec && rec.active) stats.activeReminders++;
    }
  } catch {}

  return stats;
}

function hasActivity(s) {
  return s.bulkCount + s.splitCount + s.scheduledRuns + s.pendingEscrows + s.activeReminders > 0;
}

function formatStats(s) {
  const lines = [
    `Current balance: ${s.balance.toFixed(6)} zkLTC`,
    `Bulk payouts sent: ${s.bulkCount} (${s.bulkTotal.toFixed(6)} zkLTC total)`,
    `Split requests created: ${s.splitCount} (${s.splitPaid} paid, ${s.splitPending} pending)`,
    `Scheduled payments executed: ${s.scheduledRuns} (${s.scheduledTotal.toFixed(6)} zkLTC total)`,
    `Escrows still pending: ${s.pendingEscrows}`,
    `Active reminders: ${s.activeReminders}`,
  ];
  return lines.join('\n');
}

async function generateInsight(statsText) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `Write a friendly 3-4 sentence weekly summary for a LitAgent crypto wallet user based on these stats from the past 7 days. Mention what stands out, and if anything needs attention (like pending splits or escrows). Plain text, no markdown, no bullet points.\n\n${statsText}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const auth = req.headers['authorization'];
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const owners = await redisMembers('notifyPrefs:allOwners');

    let checked = 0;
    let sent = 0;
    let skipped = 0;

    for (const owner of owners) {
      checked++;
      try {
        const prefs = await redisGet(`notifyPrefs:${owner}`);
        if (!prefs || (!prefs.email && !prefs.telegramChatId)) continue;

        const stats = await gatherStats(owner, provider);
        if (!hasActivity(stats)) {
          skipped++;
          continue;
        }

        const statsText = formatStats(stats);
        const insight = await generateInsight(statsText);

        const message = `Your LitAgent Weekly Digest\n\n${insight ? insight + '\n\n' : ''}This week at a glance:\n${statsText}\n\nOpen LitAgent: https://www.litagent.online/app`;

        if (prefs.email) await sendEmail(prefs.email, 'Your LitAgent Weekly Digest', message);
        if (prefs.telegramChatId) await sendTelegram(prefs.telegramChatId, message);
        sent++;
      } catch (e) {
        console.error('Digest error for', owner, e);
      }
    }

    res.status(200).json({ success: true, checked, sent, skipped });
  } catch (e) {
    console.error('Weekly digest error:', e);
    res.status(500).json({ error: e.message });
  }
}