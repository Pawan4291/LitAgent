async function sendEmail(to, subject, text) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LitAgent <notifications@litagent.online>',
        to,
        subject,
        text,
      }),
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

export default async function handler(req, res) {
  const auth = req.headers['authorization'];
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    const ownersRes = await fetch(`${UPSTASH_URL}/smembers/notifyPrefs:allOwners`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    const ownersData = await ownersRes.json();
    const owners = ownersData.result || [];

    let checked = 0;
    let sent = 0;

    for (const owner of owners) {
      checked++;

      const prefsRes = await fetch(`${UPSTASH_URL}/get/notifyPrefs:${owner}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const prefsData = await prefsRes.json();
      const prefs = prefsData.result ? JSON.parse(prefsData.result) : null;
      if (!prefs || (!prefs.email && !prefs.telegramChatId)) continue;

      if (prefs.lowBalanceThreshold > 0) {
        try {
          const balRes = await fetch('https://liteforge.rpc.caldera.xyz/http', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBalance', params: [owner, 'latest'], id: 1 }),
          });
          const balData = await balRes.json();
          const balanceWei = BigInt(balData.result || '0x0');
          const balanceEth = Number(balanceWei) / 1e18;
          const now = Date.now();
          const cooldownOk = !prefs.lastBalanceAlertAt || now - prefs.lastBalanceAlertAt > 3600000;

          if (balanceEth < prefs.lowBalanceThreshold && cooldownOk) {
            const msg = `LitAgent Alert: Your balance dropped below ${prefs.lowBalanceThreshold} zkLTC (currently ${balanceEth.toFixed(6)} zkLTC).`;
            if (prefs.email) await sendEmail(prefs.email, 'LitAgent Low Balance Alert', msg);
            if (prefs.telegramChatId) await sendTelegram(prefs.telegramChatId, msg);
            sent++;

            prefs.lastBalanceAlertAt = now;
            await fetch(`${UPSTASH_URL}/set/notifyPrefs:${owner}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
              body: JSON.stringify(prefs),
            });
          }
        } catch (e) {
          console.error('Balance check error for', owner, e);
        }
      }

      const remIdsRes = await fetch(`${UPSTASH_URL}/smembers/reminders:${owner}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const remIdsData = await remIdsRes.json();
      const remIds = remIdsData.result || [];

      for (const id of remIds) {
        const rRes = await fetch(`${UPSTASH_URL}/get/reminder:${id}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        });
        const rData = await rRes.json();
        const reminder = rData.result ? JSON.parse(rData.result) : null;
        if (!reminder || !reminder.active || reminder.nextDue > Date.now()) continue;
        if (reminder.notifiedAt && reminder.notifiedAt >= reminder.nextDue - (reminder.intervalMs || 0)) continue;

        const msg = `LitAgent Reminder: ${reminder.label}${reminder.amount ? ` — ${reminder.amount} zkLTC` : ''}${reminder.to ? ` to ${reminder.to}` : ''}`;
        if (prefs.email) await sendEmail(prefs.email, 'LitAgent Reminder', msg);
        if (prefs.telegramChatId) await sendTelegram(prefs.telegramChatId, msg);
        sent++;

        reminder.notifiedAt = Date.now();
        await fetch(`${UPSTASH_URL}/set/reminder:${id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
          body: JSON.stringify(reminder),
        });
      }
    }

    res.status(200).json({ success: true, checked, sent });
  } catch (e) {
    console.error('Cron notification error:', e);
    res.status(500).json({ error: e.message });
  }
}