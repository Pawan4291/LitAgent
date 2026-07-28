export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    if (req.method === 'POST') {
      const { sender, label, recipients, hash } = req.body;
      if (!sender || !Array.isArray(recipients) || recipients.length === 0) {
        res.status(400).json({ error: 'Missing sender or recipients' });
        return;
      }

      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const record = {
        id,
        sender: sender.toLowerCase(),
        label: label || 'Bulk Payout',
        recipients: recipients.map((r) => ({ address: r.address.toLowerCase(), amount: r.amount })),
        hash,
        timestamp: Date.now(),
      };

      await fetch(`${UPSTASH_URL}/set/bulklog:${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        body: JSON.stringify(record),
      });

      await fetch(`${UPSTASH_URL}/sadd/bulklog:sender:${record.sender}/${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });

      for (const r of record.recipients) {
        await fetch(`${UPSTASH_URL}/sadd/bulklog:recipient:${r.address}/${id}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        });
      }

      res.status(200).json({ success: true, id });
      return;
    }

    if (req.method === 'GET') {
      const { sender, recipient } = req.query;
      const key = sender ? `bulklog:sender:${sender.toLowerCase()}` : recipient ? `bulklog:recipient:${recipient.toLowerCase()}` : null;
      if (!key) { res.status(400).json({ error: 'Missing sender or recipient' }); return; }

      const membersRes = await fetch(`${UPSTASH_URL}/smembers/${key}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const membersData = await membersRes.json();
      const ids = membersData.result || [];

      const records = await Promise.all(
        ids.map(async (logId) => {
          const r = await fetch(`${UPSTASH_URL}/get/bulklog:${logId}`, {
            headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
          });
          const d = await r.json();
          return d.result ? JSON.parse(d.result) : null;
        })
      );

      res.status(200).json({ success: true, records: records.filter(Boolean) });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Bulk log error:', e);
    res.status(500).json({ error: e.message });
  }
}