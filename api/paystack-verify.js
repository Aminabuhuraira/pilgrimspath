// api/paystack-verify.js
// Verify Paystack payment — Vercel serverless function
// GET /api/paystack-verify?reference=xxx

const https = require('https');
const http  = require('http');

const { applyCors, rateLimit } = require('./_security');

// Fire-and-forget welcome email after confirmed payment
function sendWelcomeEmail(email, firstName, plan) {
  try {
    const body = JSON.stringify({ email, firstName: firstName || '', plan: plan || 'hajj' });
    // Call /api/welcome-email on the same server (loopback)
    const port = process.env.PORT || 3000;
    const req = http.request(
      { hostname: '127.0.0.1', port, path: '/api/welcome-email', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body),
                   'Origin': `http://127.0.0.1:${port}` } },
      (res) => { res.resume(); console.log('[Verify] welcome-email status', res.statusCode); }
    );
    req.on('error', (e) => console.warn('[Verify] welcome-email fire failed:', e.message));
    req.write(body);
    req.end();
  } catch (e) {
    console.warn('[Verify] welcome-email dispatch error:', e.message);
  }
}

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

module.exports = async function handler(req, res) {
  if (!applyCors(req, res, 'GET, OPTIONS')) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!rateLimit(req, res, { windowMs: 60_000, max: 30 })) return;

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

    // Fire welcome email on confirmed payment (non-blocking)
    if (result && result.data && result.data.status === 'success') {
      const customerEmail = (result.data.customer && result.data.customer.email) || '';
      const meta = result.data.metadata || {};
      const firstName = meta.firstName || meta.first_name || '';
      const plan = (meta.plan && meta.plan.toLowerCase().includes('umrah')) ? 'umrah' : 'hajj';
      if (customerEmail) sendWelcomeEmail(customerEmail, firstName, plan);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[Paystack Verify Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
