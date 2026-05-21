// api/journey-audio.js
// Admin-only endpoint: receives a base64-encoded audio file from the Journey
// Content Manager, saves it to data/audio/<lang>/<filename> on the server,
// and returns the filename.  journey-content-loader.js then resolves it
// via the normal /Hajj%20voiceover%20english/<lang>/<file> path OR via
// /api/journey-audio?file=... for admin-uploaded files.
//
// POST  /api/journey-audio
//   Body (JSON): { filename, lang, data }
//     filename  — original file name (e.g. "my-audio.mp3")
//     lang      — language code (e.g. "en")
//     data      — base64 data-URI (data:audio/...;base64,...)
//   Returns: { ok: true, filename: "<saved-name>", url: "/data/audio/<lang>/<saved-name>" }
//
// GET   /api/journey-audio?file=<lang>/<filename>
//   Streams the file back. Used so uploaded audio works in the VR experience
//   from any device without needing separate static-file deployment.

'use strict';

const path = require('path');
const fs   = require('fs');
const jwt  = require('jsonwebtoken');
const { createHash } = require('crypto');

const AUDIO_DIR = path.join(process.cwd(), 'data', 'audio');

// --- Auth helper -------------------------------------------------------------
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

// Sanitise a filename: keep only alphanumerics, hyphens, underscores, dots.
function sanitiseFilename(name) {
  return String(name || 'audio.mp3')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')       // collapse consecutive dots
    .replace(/^[._-]+/, '')        // no leading dots/dashes
    .slice(0, 120) || 'audio.mp3';
}

// Sanitise a lang code: a-z, 0-9, hyphens only, max 10 chars.
function sanitiseLang(code) {
  return String(code || 'en').replace(/[^a-z0-9-]/g, '').slice(0, 10) || 'en';
}

// --- Handler -----------------------------------------------------------------
module.exports = function handler(req, res) {
  setCors(req, res);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // ── GET: serve a stored admin-uploaded audio file ────────────────────────
  if (req.method === 'GET') {
    const fileParam = (req.query && req.query.file) || '';
    // fileParam must be  "<lang>/<filename>" — no path traversal
    if (!fileParam || fileParam.includes('..') || fileParam.includes('\0')) {
      return res.status(400).json({ error: 'Invalid file parameter' });
    }
    const parts = fileParam.split('/');
    if (parts.length !== 2) {
      return res.status(400).json({ error: 'file must be <lang>/<filename>' });
    }
    const langSafe = sanitiseLang(parts[0]);
    const fileSafe = sanitiseFilename(parts[1]);
    const filePath = path.join(AUDIO_DIR, langSafe, fileSafe);

    // Ensure resolved path stays inside AUDIO_DIR
    if (!filePath.startsWith(path.resolve(AUDIO_DIR) + path.sep)) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const ext = path.extname(fileSafe).toLowerCase();
    const MIME = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.aac': 'audio/aac' };
    res.setHeader('Content-Type', MIME[ext] || 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return fs.createReadStream(filePath).pipe(res);
  }

  // ── POST: upload an audio file (admin only) ───────────────────────────────
  if (req.method === 'POST') {
    if (!requireAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body;
    if (!body || !body.data || !body.filename) {
      return res.status(400).json({ error: 'Missing filename or data' });
    }

    // Validate data-URI format
    const dataUri = String(body.data);
    const match = dataUri.match(/^data:(audio\/[^;]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'data must be a valid audio data-URI' });
    }

    const lang     = sanitiseLang(body.lang || 'en');
    const origName = sanitiseFilename(body.filename);

    // Derive a safe, unique stored filename: hash(original) + extension
    const ext = path.extname(origName) || '.mp3';
    const hash = createHash('sha256').update(dataUri.slice(0, 200) + origName).digest('hex').slice(0, 12);
    const storedName = origName.replace(ext, '') + '-' + hash + ext;

    const langDir  = path.join(AUDIO_DIR, lang);
    const filePath = path.join(langDir, storedName);

    // Path-traversal guard
    if (!filePath.startsWith(path.resolve(AUDIO_DIR) + path.sep)) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    try {
      if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });
      const buffer = Buffer.from(match[2], 'base64');
      // Reject if decoded size > 15 MB (generous but bounded)
      if (buffer.length > 15 * 1024 * 1024) {
        return res.status(413).json({ error: 'Audio file too large (max 15 MB)' });
      }
      fs.writeFileSync(filePath, buffer);
      const url = `/api/journey-audio?file=${encodeURIComponent(lang + '/' + storedName)}`;
      return res.status(200).json({ ok: true, filename: storedName, originalName: origName, lang, url });
    } catch (e) {
      console.error('[journey-audio] write error:', e.message);
      return res.status(500).json({ error: 'Failed to save audio' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
};
