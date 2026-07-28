export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    if (req.method === 'POST') {
      const { creator, description, token, recipients, deadline } = req.body;

      if (!creator || !Array.isArray(recipients) || recipients.length === 0) {
        res.status(400).json({ error: 'Missing creator or recipients' });
        return;
      }

      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

      const record = {
        id,
        creator: creator.toLowerCase(),
        description: description || '',
        token: token || 'zkLTC',
        recipients: recipients.map((r) => ({
          address: r.address.toLowerCase(),
          amount: r.amount,
          paid: false,
          txHash: null,
        })),
        deadline: deadline || null,
        createdAt: Date.now(),
      };

      const setResponse = await fetch(`${UPSTASH_URL}/set/split:${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        body: JSON.stringify(record),
      });
      const setData = await setResponse.json();
      console.log('Upstash set split:', setData);

      await fetch(`${UPSTASH_URL}/sadd/splits:${record.creator}/${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });

      res.status(200).json({ success: true, id, record });
      return;
    }

    if (req.method === 'PATCH') {
      const { id, address, txHash } = req.body;
      if (!id || !address || !txHash) {
        res.status(400).json({ error: 'Missing id, address, or txHash' });
        return;
      }

      const getResponse = await fetch(`${UPSTASH_URL}/get/split:${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const getData = await getResponse.json();
      if (!getData.result) { res.status(404).json({ error: 'Split not found' }); return; }

      const record = JSON.parse(getData.result);
      const recipient = record.recipients.find((r) => r.address === address.toLowerCase());
      if (!recipient) { res.status(404).json({ error: 'Not a recipient of this split' }); return; }

      recipient.paid = true;
      recipient.txHash = txHash;

      await fetch(`${UPSTASH_URL}/sadd/splits:recipient:${address.toLowerCase()}/${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });

      await fetch(`${UPSTASH_URL}/set/split:${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        body: JSON.stringify(record),
      });

      res.status(200).json({ success: true, record });
      return;
    }

    if (req.method === 'GET') {
      const { id, creator } = req.query;

      const { recipient } = req.query;
      if (recipient && !id) {
        const membersRes = await fetch(`${UPSTASH_URL}/smembers/splits:recipient:${recipient.toLowerCase()}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        });
        const membersData = await membersRes.json();
        const ids = membersData.result || [];
        const records = await Promise.all(
          ids.map(async (splitId) => {
            const r = await fetch(`${UPSTASH_URL}/get/split:${splitId}`, {
              headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
            });
            const d = await r.json();
            return d.result ? JSON.parse(d.result) : null;
          })
        );
        res.status(200).json({ success: true, records: records.filter(Boolean) });
        return;
      }

      if (creator && !id) {
        const membersRes = await fetch(`${UPSTASH_URL}/smembers/splits:${creator.toLowerCase()}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        });
        const membersData = await membersRes.json();
        const ids = membersData.result || [];

        const records = await Promise.all(
          ids.map(async (splitId) => {
            const r = await fetch(`${UPSTASH_URL}/get/split:${splitId}`, {
              headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
            });
            const d = await r.json();
            return d.result ? JSON.parse(d.result) : null;
          })
        );

        res.status(200).json({ success: true, records: records.filter(Boolean) });
        return;
      }

      if (!id) { res.status(400).json({ error: 'Missing id' }); return; }

      const getResponse = await fetch(`${UPSTASH_URL}/get/split:${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const getData = await getResponse.json();

      if (!getData.result) { res.status(404).json({ error: 'Split not found' }); return; }

      const record = JSON.parse(getData.result);
      res.status(200).json({ success: true, record });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
    return;
  } catch (e) {
    console.error('Split request error:', e);
    res.status(500).json({ error: e.message });
  }
}