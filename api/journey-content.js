// api/journey-content.js
// Universal Journey Content Manager sync endpoint.
//
// GET  (public, no auth)
//   Returns the server-stored journey content JSON.
//   Used by journey-content-loader.js on every device to get the latest
//   admin-published content instead of relying on device-local localStorage.
//
// POST (admin JWT required)
//   Saves the full journey content JSON to disk so all devices see the
//   same content immediately after an admin publishes.

'use strict';

const path = require('path');
const fs   = require('fs');
const jwt  = require('jsonwebtoken');

const CONTENT_FILE = path.join(process.cwd(), 'data', 'journey-content.json');

// --- Auth helper (shared pattern with journey-languages.js) ------------------
function requireAdmin(req) {
  let token = req.cookies && req.cookies.pp_admin_session;
  if (!token) {
    const cookieHeader = req.headers.cookie || '';
    const m = cookieHeader.match(/(?:^|;\s*)pp_admin_session=([^;]+)/);
    token = m ? m[1] : null;
  }
  const jwtSecret = process.env.JWT_SECRET;
  if (!token || !jwtSecret) return false;
  try {
    const payload = jwt.verify(token, jwtSecret);
    return payload.role === 'admin';
  } catch (_) {
    return false;
  }
}

// --- CORS helper -------------------------------------------------------------
function setCors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = [
    'https://www.pilgrimspath.io', 'https://pilgrimspath.io',
    'http://localhost:3000', 'http://127.0.0.1:3000'
  ];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// --- File helpers ------------------------------------------------------------
function readContent() {
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      const raw = fs.readFileSync(CONTENT_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.scenes) return parsed;
    }
  } catch (_) {}
  return null; // signal: no server content yet — client falls back to DEFAULT_DATA
}

// Validate that the body looks like a journey-content object (basic sanity).
// We do NOT re-sanitise deeply — the admin is trusted (JWT-gated).
function isValidContent(obj) {
  return obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.scenes) &&
    obj.scenes.length > 0 &&
    Array.isArray(obj.languages) &&
    obj.languages.length > 0;
}

// --- Handler -----------------------------------------------------------------
module.exports = function handler(req, res) {
  setCors(req, res);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // ── GET: serve stored content (public — all visitors/devices need this) ──
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store'); // always latest
    const content = readContent();
    if (!content) {
      // Nothing published yet — tell clients to use their DEFAULT_DATA
      return res.status(204).end();
    }
    return res.status(200).json(content);
  }

  // ── POST: save content (admin only) ──────────────────────────────────────
  if (req.method === 'POST') {
    if (!requireAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body;
    if (!isValidContent(body)) {
      return res.status(400).json({ error: 'Invalid content structure' });
    }

    // Sanitize audio fields: strip any base64 data-URIs before saving.
    // Audio is stored as server files (see api/journey-audio.js) — base64
    // in localStorage is a local-only fallback that must never be persisted
    // server-side (it would bloat the JSON and break cross-device delivery).
    try {
      body.scenes.forEach(function (scene) {
        (scene.banners || []).forEach(function (banner) {
          ['audio', 'audioChain'].forEach(function (field) {
            if (banner[field] && typeof banner[field] === 'object') {
              Object.keys(banner[field]).forEach(function (lang) {
                const val = banner[field][lang];
                if (typeof val === 'string' && val.startsWith('data:')) {
                  // Strip base64 — the real file path should have been saved
                  // by api/journey-audio.js before this POST was called.
                  banner[field][lang] = '';
                }
              });
            }
          });
        });
      });
    } catch (_) {}

    try {
      const dir = path.dirname(CONTENT_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CONTENT_FILE, JSON.stringify(body, null, 2), 'utf8');
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('[journey-content] write error:', e.message);
      return res.status(500).json({ error: 'Failed to save content' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
};
