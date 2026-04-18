// api/paystack-init.js
// Paystack payment initialization — Vercel serverless function
// POST /api/paystack-init
// Keeps secret key server-side only

const https = require('https');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, amount, metadata, callback_url } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: 'email and amount are required' });
    }

    // Initialize transaction via Paystack API
    const payload = JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Paystack uses kobo/cents
      currency: 'USD',
      callback_url: callback_url || 'https://www.pilgrimspath.io/dashboard.html?payment=success',
      metadata: {
        ...metadata,
        custom_fields: [
          { display_name: 'Plan', variable_name: 'plan', value: metadata?.plan || 'Full VR Experience' }
        ]
      }
    });

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/transaction/initialize',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
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
      request.write(payload);
      request.end();
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('[Paystack Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
