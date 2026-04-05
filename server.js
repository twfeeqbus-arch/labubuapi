const http = require('http');
const fs = require('fs');

const DATA_FILE = './tiers.json';
const PORT = 3000;

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

function loadTiers() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveTiers(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // GET /tier?ign=PlayerName
  if (req.method === 'GET' && url.pathname === '/tier') {
    const ign = url.searchParams.get('ign')?.toLowerCase();
    if (!ign) return res.end(JSON.stringify({ error: 'No IGN provided' }));
    const tiers = loadTiers();
    const tier = tiers[ign];
    if (!tier) return res.end(JSON.stringify({ tier: null }));
    return res.end(JSON.stringify({ ign, tier }));
  }

  // POST /tier  body: { ign, tier, secret }
  if (req.method === 'POST' && url.pathname === '/tier') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { ign, tier, secret } = JSON.parse(body);
        if (secret !== process.env.API_SECRET || 'labubu_secret_key') {
          res.statusCode = 401;
          return res.end(JSON.stringify({ error: 'Unauthorized' }));
        }
        const tiers = loadTiers();
        tiers[ign.toLowerCase()] = tier;
        saveTiers(tiers);
        return res.end(JSON.stringify({ success: true, ign, tier }));
      } catch (e) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Invalid body' }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Tier API running on port ${PORT}`);
});
