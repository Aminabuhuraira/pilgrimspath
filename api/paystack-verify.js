// api/paystack-verify.js
// Verify Paystack payment — Vercel serverless function
// GET /api/paystack-verify?reference=xxx

const https = require('https');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const reference = req.query.reference;
  if (!reference) return res.status(400).json({ error: 'reference is required' });

  // Validate reference format to prevent injection
  if (!/^[a-zA-Z0-9_-]+$/.test(reference)) {
    return res.status(400).json({ error: 'Invalid reference format' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: `/transaction/verify/${encodeURIComponent(reference)}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET}`,
        },
      };

      const request = https.request(options, (response) => {
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { resolve({ raw: body }); }
        });
      });

      request.on('error', reject);
      request.end();
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('[Paystack Verify Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
