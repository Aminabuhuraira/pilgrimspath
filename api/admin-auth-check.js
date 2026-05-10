// api/admin-auth-check.js
// Lightweight GET endpoint that returns 200 if the pp_admin_session cookie
// contains a valid JWT, 401 otherwise.
// Used by admin.html on page load to auto-show the dashboard.

'use strict';

const jwt = require('jsonwebtoken');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read the HttpOnly cookie from the parsed cookie object (set by cookie-parser
  // in server.js) or fall back to raw header parsing for the Vercel environment.
  let token = req.cookies && req.cookies.pp_admin_session;
  if (!token) {
    // Fallback: parse the Cookie header manually
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/(?:^|;\s*)pp_admin_session=([^;]+)/);
    token = match ? match[1] : null;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!token || !jwtSecret) return res.status(401).json({ ok: false });

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (payload.role !== 'admin') throw new Error('not admin');
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(401).json({ ok: false });
  }
};
