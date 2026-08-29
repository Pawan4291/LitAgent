export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    if (req.method === 'POST') {
      const { seller, buyer, note, label } = req.body;
      if (!seller || !buyer || !note) {
        res.status(400).json({ error: 'Missing seller, buyer, or note' });
        return;
      }

      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const record = {
        id,
        seller: seller.toLowerCase(),
        buyer: buyer.toLowerCase(),
        note,
        label: label || '',
        submittedAt: Date.now(),
      };

      await fetch(`${UPSTASH_URL}/set/escrowDelivery:${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        body: JSON.stringify(record),
      });

      await fetch(`${UPSTASH_URL}/sadd/escrowDelivery:buyer:${record.buyer}/${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      await fetch(`${UPSTASH_URL}/sadd/escrowDelivery:seller:${record.seller}/${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });

      res.status(200).json({ success: true, id });
      return;
    }

    if (req.method === 'GET') {
      const { buyer, seller } = req.query;
      if (!buyer && !seller) { res.status(400).json({ error: 'Missing buyer or seller' }); return; }

      const key = buyer ? `escrowDelivery:buyer:${buyer.toLowerCase()}` : `escrowDelivery:seller:${seller.toLowerCase()}`;
      const membersRes = await fetch(`${UPSTASH_URL}/smembers/${key}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const membersData = await membersRes.json();
      const ids = membersData.result || [];

      const records = await Promise.all(
        ids.map(async (id) => {
          const r = await fetch(`${UPSTASH_URL}/get/escrowDelivery:${id}`, {
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
    console.error('Escrow delivery error:', e);
    res.status(500).json({ error: e.message });
  }
}