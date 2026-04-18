// api/capi-event.js
// Meta Conversions API proxy — Vercel serverless function
// POST /api/capi-event

const https = require('https');
const crypto = require('crypto');

const DATASET_ID = '1267382605021300';
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN || '';
const API_VERSION = 'v19.0';

function sha256(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

function buildEvent(data, clientIP) {
  const event = {
    event_name: data.event_name || 'PageView',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: data.event_source_url || '',
  };

  if (data.event_id) event.event_id = data.event_id;

  // User data
  const ud = {};
  ud.client_ip_address = clientIP || '0.0.0.0';
  if (data.user_agent) ud.client_user_agent = data.user_agent;
  if (data.fbp) ud.fbp = data.fbp;
  if (data.fbc) ud.fbc = data.fbc;

  const userData = data.user_data || {};
  const hashFields = ['em', 'ph', 'fn', 'ln', 'ct', 'st', 'zp', 'country', 'ge', 'db'];
  for (const field of hashFields) {
    if (userData[field]) {
      ud[field] = (field === 'em' || field === 'ph') ? [sha256(userData[field])] : sha256(userData[field]);
    }
  }
  if (userData.external_id) ud.external_id = [sha256(userData.external_id)];

  event.user_data = ud;

  if (data.custom_data) event.custom_data = data.custom_data;

  return event;
}

function postToMeta(event) {
  return new Promise((resolve, reject) => {
    const payload = new URLSearchParams({
      data: JSON.stringify([event]),
      access_token: ACCESS_TOKEN,
    }).toString();

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/${API_VERSION}/${DATASET_ID}/events`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve({ raw: body }); }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    const clientIP = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
                  || req.headers['x-real-ip']
                  || '0.0.0.0';

    const capiEvent = buildEvent(data, clientIP);
    const result = await postToMeta(capiEvent);

    return res.status(200).json(result);
  } catch (err) {
    console.error('[CAPI Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
