export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    if (req.method === 'POST') {
      const { owner, step, completed } = req.body;
      if (!owner) { res.status(400).json({ error: 'Missing owner' }); return; }

      const record = { step: step ?? 0, completed: !!completed, updatedAt: Date.now() };

      await fetch(`${UPSTASH_URL}/set/onboarding:${owner.toLowerCase()}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        body: JSON.stringify(record),
      });

      res.status(200).json({ success: true, record });
      return;
    }

    if (req.method === 'GET') {
      const { owner } = req.query;
      if (!owner) { res.status(400).json({ error: 'Missing owner' }); return; }

      const getRes = await fetch(`${UPSTASH_URL}/get/onboarding:${owner.toLowerCase()}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const getData = await getRes.json();
      const record = getData.result ? JSON.parse(getData.result) : { step: 0, completed: false };

      res.status(200).json({ success: true, record });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Onboarding error:', e);
    res.status(500).json({ error: e.message });
  }
}