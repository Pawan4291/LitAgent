export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const { address } = req.body;
    if (!address) { res.status(400).json({ error: 'Missing address' }); return; }

    const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    const response = await fetch(`${UPSTASH_URL}/sadd/wallets/${address.toLowerCase()}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });

    const data = await response.json();
    console.log('Upstash response:', data);

    res.status(200).json({ success: true });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: e.message });
  }
}