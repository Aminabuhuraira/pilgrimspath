// api/paystack-verify.js
// Verify Paystack payment — Vercel serverless function
// GET /api/paystack-verify?reference=xxx

const https = require('https');
const http  = require('http');
const jwt   = require('jsonwebtoken');

// Save a confirmed transaction to Supabase (fire-and-forget, never blocks response)
async function saveTransaction({ reference, email, amount, currency, plan, metadata }) {
  const supaUrl  = process.env.SUPABASE_URL || 'https://giftctxrqvlfekhzpcaa.supabase.co';
  const supaKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey  = process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZnRjdHhycXZsZmVraHpwY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg0NjQsImV4cCI6MjA4ODI5NDQ2NH0.Dm4tb6lvLMf9CDLo04qA9msYVLjBT-Web48pgk0BOYc';
  // Use service role if available (bypasses RLS), otherwise anon key
  // transactions table INSERT policy allows anon inserts so anon key works too
  const key = supaKey && supaKey.length > 100 ? supaKey : anonKey;
  try {
    const body = JSON.stringify({
      reference, email,
      amount: Number((amount / 100).toFixed(2)), // Paystack sends kobo/cents
      currency: currency || 'USD',
      status: 'completed',
      type: 'purchase',
      plan: plan || 'hajj',
      source: (metadata && metadata.source) || 'paystack',
      provider: 'paystack',
      metadata: metadata || {},
      paid_at: new Date().toISOString()
    });
    const res = await fetch(supaUrl + '/rest/v1/transactions', {
      method: 'POST',
      headers: {
        'apikey': key, 'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'  // safe to call twice for same reference
      },
      body
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.warn('[Verify] Supabase transaction save failed:', res.status, txt);
    } else {
      console.log('[Verify] Transaction saved to Supabase:', reference);
    }
  } catch (e) {
    console.warn('[Verify] Supabase transaction save error:', e.message);
  }
}

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

      // Save transaction to Supabase for admin revenue reporting (non-blocking)
      saveTransaction({
        reference: result.data.reference || reference,
        email: customerEmail,
        amount: result.data.amount || 0,      // in kobo/cents
        currency: result.data.currency || 'USD',
        plan,
        metadata: meta
      });

      // Issue a signed access cookie granting entry to the VR experience.
      // HttpOnly + Secure so it cannot be read or forged by client-side JS.
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        const accessToken = jwt.sign(
          { email: customerEmail, paid: true, ref: reference, plan },
          jwtSecret,
          { expiresIn: '365d' }
        );
        const isHttps = (res.req && res.req.headers['x-forwarded-proto'] === 'https') ||
                        (res.socket && res.socket.encrypted);
        const cookieFlags = isHttps
          ? 'HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=31536000'
          : 'HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000';
        res.setHeader('Set-Cookie', `pp_access=${accessToken}; ${cookieFlags}`);
      } else {
        console.warn('[Paystack Verify] JWT_SECRET not set — skipping access cookie');
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[Paystack Verify Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
