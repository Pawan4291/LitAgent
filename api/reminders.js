export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    if (req.method === 'POST') {
      const { owner, label, to, amount, startAt, intervalMs } = req.body;
      if (!owner || !label || !startAt || !intervalMs) {
        res.status(400).json({ error: 'Missing owner, label, startAt, or intervalMs' });
        return;
      }

      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const record = {
        id,
        owner: owner.toLowerCase(),
        label,
        to: to || null,
        amount: amount || null,
        intervalMs,
        nextDue: startAt,
        active: true,
        createdAt: Date.now(),
      };

      await fetch(`${UPSTASH_URL}/set/reminder:${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        body: JSON.stringify(record),
      });

      await fetch(`${UPSTASH_URL}/sadd/reminders:${record.owner}/${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });

      res.status(200).json({ success: true, id, record });
      return;
    }

    if (req.method === 'GET') {
      const { owner } = req.query;
      if (!owner) { res.status(400).json({ error: 'Missing owner' }); return; }

      const membersRes = await fetch(`${UPSTASH_URL}/smembers/reminders:${owner.toLowerCase()}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const membersData = await membersRes.json();
      const ids = membersData.result || [];

      const records = await Promise.all(
        ids.map(async (id) => {
          const r = await fetch(`${UPSTASH_URL}/get/reminder:${id}`, {
            headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
          });
          const d = await r.json();
          return d.result ? JSON.parse(d.result) : null;
        })
      );

      res.status(200).json({ success: true, records: records.filter(Boolean) });
      return;
    }

    if (req.method === 'DELETE') {
      const { owner, id } = req.body;
      if (!owner || !id) { res.status(400).json({ error: 'Missing owner or id' }); return; }

      await fetch(`${UPSTASH_URL}/srem/reminders:${owner.toLowerCase()}/${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      await fetch(`${UPSTASH_URL}/del/reminder:${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });

      res.status(200).json({ success: true });
      return;
    }

    if (req.method === 'PATCH') {
      const { id, owner } = req.body;
      if (!id || !owner) { res.status(400).json({ error: 'Missing id or owner' }); return; }

      const getRes = await fetch(`${UPSTASH_URL}/get/reminder:${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const getData = await getRes.json();
      if (!getData.result) { res.status(404).json({ error: 'Reminder not found' }); return; }

      const record = JSON.parse(getData.result);
      record.nextDue = record.nextDue + record.intervalMs;

      await fetch(`${UPSTASH_URL}/set/reminder:${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        body: JSON.stringify(record),
      });

      res.status(200).json({ success: true, record });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Reminders error:', e);
    res.status(500).json({ error: e.message });
  }
}