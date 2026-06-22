const http = require('http');
require('dotenv').config();

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisCommand(...args) {
  const res = await fetch(`${UPSTASH_URL}/${args.join('/')}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
  });
  return res.json();
}

async function addWallet(address) {
  await redisCommand('sadd', 'wallets', address.toLowerCase());
}

async function getWallets() {
  const res = await redisCommand('smembers', 'wallets');
  return res.result || [];
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/register') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { address } = JSON.parse(body);
        if (!address) { res.writeHead(400); res.end('Missing address'); return; }
        await addWallet(address);
        console.log(`✅ Registered wallet: ${address}`);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500);
        res.end(e.message);
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(process.env.PORT || 8080, () => {
  console.log(`🚀 API server running on port ${process.env.PORT || 8080}`);
});

module.exports = { getWallets };