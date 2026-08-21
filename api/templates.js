export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    if (req.method === 'POST') {
      const { owner, label, command } = req.body;
      if (!owner || !label || !command) {
        res.status(400).json({ error: 'Missing owner, label, or command' });
        return;
      }

      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const record = { id, owner: owner.toLowerCase(), label, command, createdAt: Date.now() };

      await fetch(`${UPSTASH_URL}/set/template:${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        body: JSON.stringify(record),
      });

      await fetch(`${UPSTASH_URL}/sadd/templates:${record.owner}/${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });

      res.status(200).json({ success: true, id, record });
      return;
    }

    if (req.method === 'GET') {
      const { owner } = req.query;
      if (!owner) { res.status(400).json({ error: 'Missing owner' }); return; }

      const membersRes = await fetch(`${UPSTASH_URL}/smembers/templates:${owner.toLowerCase()}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const membersData = await membersRes.json();
      const ids = membersData.result || [];

      const records = await Promise.all(
        ids.map(async (id) => {
          const r = await fetch(`${UPSTASH_URL}/get/template:${id}`, {
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

      await fetch(`${UPSTASH_URL}/srem/templates:${owner.toLowerCase()}/${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      await fetch(`${UPSTASH_URL}/del/template:${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });

      res.status(200).json({ success: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Templates error:', e);
    res.status(500).json({ error: e.message });
  }
}