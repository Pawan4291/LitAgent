export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    if (req.method === 'POST') {
      const { owner, email, telegramChatId, lowBalanceThreshold } = req.body;
      if (!owner) { res.status(400).json({ error: 'Missing owner' }); return; }

      const record = {
        email: email || null,
        telegramChatId: telegramChatId || null,
        lowBalanceThreshold: lowBalanceThreshold || 0,
        updatedAt: Date.now(),
      };

      await fetch(`${UPSTASH_URL}/set/notifyPrefs:${owner.toLowerCase()}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        body: JSON.stringify(record),
      });

      if (email || telegramChatId) {
        await fetch(`${UPSTASH_URL}/sadd/notifyPrefs:allOwners/${owner.toLowerCase()}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        });
      } else {
        await fetch(`${UPSTASH_URL}/srem/notifyPrefs:allOwners/${owner.toLowerCase()}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        });
      }

      res.status(200).json({ success: true, record });
      return;
    }

    if (req.method === 'GET') {
      const { owner } = req.query;
      if (!owner) { res.status(400).json({ error: 'Missing owner' }); return; }

      const getRes = await fetch(`${UPSTASH_URL}/get/notifyPrefs:${owner.toLowerCase()}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const getData = await getRes.json();
      const record = getData.result ? JSON.parse(getData.result) : { email: null, telegramChatId: null };

      res.status(200).json({ success: true, record });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Notification register error:', e);
    res.status(500).json({ error: e.message });
  }
}