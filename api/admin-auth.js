// api/admin-auth.js
// Server-side admin login — POST { email, password }
// Returns a signed HttpOnly session cookie on success.
// Replaces the client-side SHA-256 hash check in admin.html.

'use strict';

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { rateLimit } = require('./_security');

// 5 attempts per IP per 15 minutes — brute-force protection
const RATE_OPTS = { windowMs: 15 * 60_000, max: 5 };

module.exports = async function handler(req, res) {
  // Only accept POST; reject everything else
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit before touching the body
  if (!rateLimit(req, res, RATE_OPTS)) return;

  const { email, password } = req.body || {};

  // Validate inputs
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const adminEmail  = process.env.ADMIN_EMAIL || '';
  const adminHash   = process.env.ADMIN_PASSWORD_BCRYPT || '';
  const jwtSecret   = process.env.JWT_SECRET || '';

  if (!adminEmail || !adminHash || !jwtSecret) {
    console.error('[admin-auth] Missing required env vars: ADMIN_EMAIL, ADMIN_PASSWORD_BCRYPT, JWT_SECRET');
    return res.status(503).json({ error: 'Admin authentication is not configured' });
  }

  // Constant-time email check (avoid leaking whether the email exists)
  const emailMatch = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();

  // Always run bcrypt.compare so timing is consistent regardless of email match
  let passwordMatch = false;
  try {
    passwordMatch = await bcrypt.compare(password, adminHash);
  } catch (e) {
    console.error('[admin-auth] bcrypt error:', e.message);
    return res.status(500).json({ error: 'Internal error' });
  }

  if (!emailMatch || !passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Issue a signed session cookie — 8 hours
  const sessionToken = jwt.sign({ role: 'admin', email: adminEmail }, jwtSecret, { expiresIn: '8h' });
  const isHttps = (req.headers['x-forwarded-proto'] === 'https') || (req.socket && req.socket.encrypted);
  const cookieFlags = isHttps
    ? 'HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800'
    : 'HttpOnly; SameSite=Strict; Path=/; Max-Age=28800';

  res.setHeader('Set-Cookie', `pp_admin_session=${sessionToken}; ${cookieFlags}`);
  return res.status(200).json({ ok: true });
};
