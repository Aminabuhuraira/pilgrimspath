// api/journey-languages.js
// GET  — returns the admin-published language list (used by all users to build
//         the in-experience language switcher).
// POST — saves a new language list; requires admin JWT session cookie.

'use strict';

const path = require('path');
const fs   = require('fs');
const jwt  = require('jsonwebtoken');

const LANGUAGES_FILE = path.join(process.cwd(), 'data', 'journey-languages.json');

const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English',   dir: 'ltr', folder: 'English/',  isDefault: true  },
  { code: 'ar', name: 'العربية',  dir: 'rtl', folder: 'Arabic/',   isDefault: false }
];

function readLanguages() {
  try {
    if (fs.existsSync(LANGUAGES_FILE)) {
      const raw = fs.readFileSync(LANGUAGES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return DEFAULT_LANGUAGES;
}

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

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Allow same-site and the live domain
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

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(readLanguages());
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const langs = req.body;
    if (!Array.isArray(langs) || langs.length === 0) {
      return res.status(400).json({ error: 'body must be a non-empty array' });
    }

    // Sanitize each entry — never persist arbitrary strings
    const clean = langs.map(function (l) {
      return {
        code:      String(l.code      || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 10),
        name:      String(l.name      || '').replace(/[<>"]/g, '').slice(0, 60),
        dir:       l.dir === 'rtl' ? 'rtl' : 'ltr',
        folder:    String(l.folder    || '').replace(/[^a-zA-Z0-9\- _/]/g, '').slice(0, 100),
        isDefault: !!l.isDefault
      };
    }).filter(function (l) { return l.code.length > 0; });

    if (clean.length === 0) {
      return res.status(400).json({ error: 'No valid language entries after sanitisation' });
    }

    try {
      const dir = path.dirname(LANGUAGES_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(LANGUAGES_FILE, JSON.stringify(clean, null, 2), 'utf8');
      return res.status(200).json({ ok: true, languages: clean });
    } catch (e) {
      console.error('[journey-languages] write error:', e.message);
      return res.status(500).json({ error: 'Failed to save languages' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
};
