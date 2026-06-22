const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  
  const { address } = req.body;
  if (!address) { res.status(400).json({ error: 'Missing address' }); return; }

  await fetch(`${UPSTASH_URL}/sadd/wallets/${address.toLowerCase()}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
  });

  res.status(200).json({ success: true });
}