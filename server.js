// server.js — Express adapter for Pilgrim's Path on Hostinger VPS
// Wraps all api/*.js Vercel-style handlers and serves static files.
// Start: node server.js  OR  pm2 start ecosystem.config.js

'use strict';

require('dotenv').config();

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// ── Security headers (mirrors vercel.json) ────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options',  'nosniff');
  res.setHeader('X-Frame-Options',         'SAMEORIGIN');
  res.setHeader('Referrer-Policy',         'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy',      'geolocation=(), microphone=(), camera=(self), gyroscope=(self), accelerometer=(self)');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ── Mount all api/* handlers ──────────────────────────────────
const API_DIR = path.join(__dirname, 'api');
fs.readdirSync(API_DIR)
  .filter(f => f.endsWith('.js') && !f.startsWith('_'))
  .forEach(file => {
    const name    = file.replace('.js', '');
    const handler = require(path.join(API_DIR, file));
    const route   = `/api/${name}`;

    // Vercel handlers export a single function(req, res)
    app.all(route, (req, res) => handler(req, res));
  });

// Log mounted routes cleanly
const apiFiles = fs.readdirSync(API_DIR).filter(f => f.endsWith('.js') && !f.startsWith('_'));
apiFiles.forEach(f => console.log(`  ✓ /api/${f.replace('.js', '')}`));

// ── Admin route alias ─────────────────────────────────────────
// /sanctum-admin-7f3k9q2m → admin.html (keep URL in browser bar as-is)
app.get('/sanctum-admin-7f3k9q2m', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ── Static files ──────────────────────────────────────────────
// Serve everything from the project root as static
// Long cache for versioned assets, no-cache for HTML
app.use(express.static(__dirname, {
  maxAge: '7d',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

// Catch-all: unknown routes → 404 (don't serve index.html for API misses)
app.use((req, res) => {
  res.status(404).send('Not found');
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🕋 Pilgrim's Path server running on http://127.0.0.1:${PORT}`);
  console.log(`   NODE_ENV=${process.env.NODE_ENV || 'production'}`);
});
