// api/_security.js
// Shared security helpers for serverless functions.
// Keep this file dependency-free so it works on Vercel and on a Node/Express
// host (Hostinger VPS) without changes.

function getAllowedOrigins() {
  // ALLOWED_ORIGINS=https://a.com,https://b.com
  const raw = process.env.ALLOWED_ORIGINS || '';
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  // Sensible defaults so we don't accidentally lock ourselves out.
  if (list.length === 0) {
    return [
      'https://www.pilgrimspath.io',
      'https://pilgrimspath.io',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
  }
  return list;
}

// Apply strict CORS: echo the request origin only if it matches the allow list.
// Returns true if the request should continue, false if it was a preflight
// (already responded) or a disallowed origin (already responded with 403).
function applyCors(req, res, methods = 'POST, OPTIONS') {
  const origin = req.headers && req.headers.origin;
  const allowed = getAllowedOrigins();

  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    // Same-origin requests / curl with no Origin header — allow but don't echo.
  } else {
    // Disallowed cross-origin request.
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Origin not allowed' }));
    return false;
  }

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return false;
  }
  return true;
}

// Verify a request carries the admin shared secret in `Authorization: Bearer <token>`.
// Returns true if authorised, false (and responds 401) otherwise.
function requireAdminToken(req, res) {
  const token = process.env.ADMIN_API_TOKEN || '';
  if (!token) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'ADMIN_API_TOKEN not configured on server' }));
    return false;
  }
  const header = (req.headers && req.headers.authorization) || '';
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m || !timingSafeEqual(m[1], token)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return false;
  }
  return true;
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

// Very small in-memory rate limiter (per-IP). Sufficient on a single Vercel
// instance / single Node process. For production at scale, replace with Redis.
const _rateBuckets = new Map();
function rateLimit(req, res, { windowMs = 60_000, max = 30, key } = {}) {
  const ip = key || (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .toString().split(',')[0].trim();
  const now = Date.now();
  const bucket = _rateBuckets.get(ip) || { count: 0, reset: now + windowMs };
  if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + windowMs; }
  bucket.count++;
  _rateBuckets.set(ip, bucket);
  if (bucket.count > max) {
    res.statusCode = 429;
    res.setHeader('Retry-After', Math.ceil((bucket.reset - now) / 1000));
    res.end(JSON.stringify({ error: 'Too many requests' }));
    return false;
  }
  return true;
}

module.exports = { applyCors, requireAdminToken, rateLimit, getAllowedOrigins };
