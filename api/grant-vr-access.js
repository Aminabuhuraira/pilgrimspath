// api/grant-vr-access.js
// Issues a pp_access JWT cookie to any authenticated Supabase user, so
// logged-in pilgrims can enter the /journey/* VR scenes without paying.
// Caller posts with Authorization: Bearer <supabase access_token>.
// We verify the token by calling Supabase /auth/v1/user, then sign our
// own short-lived JWT using JWT_SECRET (same secret read by server.js
// requireVrAccess).

'use strict';

const jwt = require('jsonwebtoken');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://giftctxrqvlfekhzpcaa.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZnRjdHhycXZsZmVraHpwY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg0NjQsImV4cCI6MjA4ODI5NDQ2NH0.Dm4tb6lvLMf9CDLo04qA9msYVLjBT-Web48pgk0BOYc';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(503).json({ error: 'JWT_SECRET not configured' });
  }

  // Extract the Supabase access token from Authorization header
  const authHeader = req.headers.authorization || '';
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  const supabaseToken = m ? m[1].trim() : '';
  if (!supabaseToken) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  // Verify the token against Supabase by fetching the current user
  let email = '';
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${supabaseToken}`,
      },
    });
    if (!r.ok) {
      return res.status(401).json({ error: 'Invalid Supabase session' });
    }
    const u = await r.json();
    email = (u && u.email) || '';
    if (!email) {
      return res.status(401).json({ error: 'No email on Supabase session' });
    }
  } catch (e) {
    return res.status(502).json({ error: 'Supabase verification failed' });
  }

  // Issue a pp_access cookie. 30-day expiry since this is the free tier.
  const accessToken = jwt.sign(
    { email, paid: false, plan: 'free', source: 'auth' },
    jwtSecret,
    { expiresIn: '30d' }
  );

  const isHttps =
    (req.headers['x-forwarded-proto'] === 'https') ||
    (req.socket && req.socket.encrypted);
  // SameSite=Lax is the right default for an auth cookie — it is sent on
  // top-level GET navigations (which is exactly how /journey/* is reached
  // from the dashboard), while still blocking CSRF on POST. Strict was too
  // aggressive and caused the cookie to be omitted on some browser redirects.
  const flags = isHttps
    ? 'HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000'
    : 'HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000';
  // Sentinel cookie (non-HttpOnly) so client JS can confirm the browser
  // actually accepted the auth cookie before navigating into the VR gate.
  // Without this, a silently-blocked Set-Cookie causes a /login redirect loop.
  const sentinelFlags = isHttps
    ? 'Secure; SameSite=Lax; Path=/; Max-Age=2592000'
    : 'SameSite=Lax; Path=/; Max-Age=2592000';
  res.setHeader('Set-Cookie', [
    `pp_access=${accessToken}; ${flags}`,
    `pp_access_ok=1; ${sentinelFlags}`,
  ]);

  return res.status(200).json({ ok: true });
};
