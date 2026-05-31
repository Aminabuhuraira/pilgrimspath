// server.js — Express adapter for Pilgrim's Path on Hostinger VPS
// Wraps all api/*.js Vercel-style handlers and serves static files.
// Start: node server.js  OR  pm2 start ecosystem.config.js

'use strict';

require('dotenv').config();

const express      = require('express');
const path         = require('path');
const fs           = require('fs');
const cookieParser = require('cookie-parser');
const jwt          = require('jsonwebtoken');

const app  = express();
const PORT = process.env.PORT || 3000;

// Suppress Express version fingerprinting from response headers
app.disable('x-powered-by');

// ── Cookie parser (needed to read pp_access and pp_admin_session) ─
app.use(cookieParser());

// ── Body parsers ──────────────────────────────────────────────
// journey-content POST can be ~500 KB (full content JSON).
// journey-audio POST can be ~20 MB (base64-encoded MP3).
// Other endpoints only need small payloads — the large limit only kicks in
// on the /api/journey-* routes so we don't open the server to general abuse.
app.use('/api/journey-audio',   express.json({ limit: '25mb' }));
app.use('/api/journey-content', express.json({ limit: '2mb' }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// ── Block direct access to source/config files ──────────────────
// Prevents curious visitors or automated scanners from reading server-side
// source code, credentials, and architecture docs via direct URL.
app.use((req, res, next) => {
  const p = req.path;
  // Block all files in the data/ directory (journey-content.json, audio uploads)
  if (p.startsWith('/data/')) return res.status(404).send('Not found');
  // Block API source files — routes are mounted at /api/<name> (no extension)
  if (p.startsWith('/api/') && /\.js$/.test(p)) return res.status(404).send('Not found');
  // Block markdown documentation, SQL schema files, shell scripts, config files
  if (/\.(md|sql|sh|log|conf|bak|env)$/i.test(p)) return res.status(404).send('Not found');
  // Block sensitive root-level files by exact name
  const BLOCKED_PATHS = [
    '/server.js', '/auth.js', '/package.json', '/package-lock.json',
    '/ecosystem.config.js', '/vercel.json', '/.env', '/robots.txt.bak'
  ];
  if (BLOCKED_PATHS.includes(p)) return res.status(404).send('Not found');
  next();
});

// ── Security headers ──────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options',  'nosniff');
  res.setHeader('X-Frame-Options',         'SAMEORIGIN');
  res.setHeader('Referrer-Policy',         'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy',      'geolocation=(), microphone=(), camera=(self), gyroscope=(self), accelerometer=(self)');
  // Content-Security-Policy — allows the Supabase client, Paystack, Meta Pixel,
  // Google Fonts, and the 3DVista VR engine (requires unsafe-inline + blob:).
  // VR routes also need 'unsafe-eval' (3DVista animation engine) and data: media.
  const isVrPath = req.path.startsWith('/pilgrimspath-vr/');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'" + (isVrPath ? " 'unsafe-eval'" : "") + " https://js.paystack.co https://cdn.jsdelivr.net https://connect.facebook.net https://cdnjs.cloudflare.com https://assets.us.i.posthog.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' https://*.supabase.co https://api.paystack.co https://graph.facebook.com https://us.i.posthog.com; " +
    "media-src 'self' blob:" + (isVrPath ? " data:" : "") + "; " +
    "worker-src blob:; " +
    "frame-src https://checkout.paystack.com https://www.youtube-nocookie.com https://www.youtube.com; " +
    "frame-ancestors 'none';"
  );
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ── VR access gate ────────────────────────────────────────────
// ALL /pilgrimspath-vr/** requests require a valid pp_access JWT cookie.
// The cookie is issued by /api/paystack-verify on confirmed payment.
function requireVrAccess(req, res, next) {
  const token = req.cookies && req.cookies.pp_access;
  if (!token) {
    // Redirect browser requests to login (with return target) so we never
    // loop back into /hajj-vr's Begin Virtual Tour → /journey/* → /hajj-vr.
    // Reject asset fetches.
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      const next = encodeURIComponent(req.originalUrl || req.url);
      return res.redirect(302, '/login?next=' + next);
    }
    return res.status(403).send('Forbidden');
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[VR Gate] JWT_SECRET is not set — blocking access');
    return res.status(503).send('Service temporarily unavailable');
  }
  try {
    jwt.verify(token, secret);
    next();
  } catch {
    res.clearCookie('pp_access', { path: '/' });
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      const nextUrl = encodeURIComponent(req.originalUrl || req.url);
      return res.redirect(302, '/login?next=' + nextUrl);
    }
    return res.status(403).send('Forbidden');
  }
}
// ── Clean URL aliases for VR journey scenes ───────────────────
// Maps /journey/<slug>/... to the real folder under /pilgrimspath-vr/pilgrims path main/.
// Keeps the original encoded paths working so deep links don't break.
const JOURNEY_SLUG_MAP = {
  'tawaf'            : '1 Tawaf',
  'sai'              : '2 Safa and Marwa',
  'ihram'            : '0 Ihram',
  'mina'             : '3 Mina',
  'arafah'           : '4 Arafah',
  'muzdalifah'       : 'Muzdalifah',
  'jamarat-aqabah'   : 'Jamarat Aqabah',
  'rami'             : '5 Rami Jamarat, Qurbani, trim Shave, Tawaf',
  'jamarat-rooftop'  : '5 Rami Jamarat, Qurbani, trim Shave, Tawaf/Jamarat rooftop',
  'jamarat-base-12'  : 'jamarat base update 2',
};
app.use((req, res, next) => {
  const m = req.url.match(/^\/journey\/([^\/?#]+)(\/?.*)$/);
  if (!m) return next();
  const dir = JOURNEY_SLUG_MAP[m[1]];
  if (!dir) return next();
  const tail = m[2] && m[2].length > 1 ? m[2] : '/index.htm';
  const real = '/pilgrimspath-vr/pilgrims%20path%20main/' +
    encodeURIComponent(dir).replace(/%2F/g, '/') + tail;
  // HTML navigation: 302 to the real path so relative asset URLs (lib/, media/, locale/, skin/, script.js)
  // resolve under /pilgrimspath-vr/* (which nginx proxies to Node) instead of /journey/* (which nginx
  // serves as static files and 404s for asset extensions, producing a white 3DVista panorama).
  const isHtmlNav = req.method === 'GET' &&
    req.headers.accept && req.headers.accept.indexOf('text/html') !== -1;
  if (isHtmlNav) return res.redirect(302, real);
  // Non-HTML (legacy direct asset fetches): internal rewrite as before.
  req.url = real;
  next();
});

app.use('/pilgrimspath-vr', requireVrAccess);

// ── Admin session gate ────────────────────────────────────────
// Protect the admin panel with a server-side signed session cookie.
function requireAdminSession(req, res, next) {
  const token = req.cookies && req.cookies.pp_admin_session;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return res.redirect(302, '/sanctum-admin-7f3k9q2m?auth=1');
  try {
    const payload = jwt.verify(token, secret);
    if (payload.role !== 'admin') throw new Error('not admin');
    next();
  } catch {
    res.clearCookie('pp_admin_session', { path: '/' });
    return res.redirect(302, '/sanctum-admin-7f3k9q2m?auth=1');
  }
}

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
// Serve the admin HTML only. The login form POSTs to /api/admin-auth.
// The dashboard content is shown only after pp_admin_session cookie is set.
app.get('/sanctum-admin-7f3k9q2m', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ── Landing page clean URL ─────────────────────────────────────
app.get('/lp', (req, res) => {
  res.sendFile(path.join(__dirname, 'lp.html'));
});

// ── Debug: echo cookies visible to server ─────────────────────
// Only available from same origin. Helps diagnose cookie delivery issues.
app.get('/api/debug-cookies', (req, res) => {
  const c = req.cookies || {};
  res.json({
    hasPpAccess: !!c.pp_access,
    ppAccessOk: c.pp_access_ok || null,
    cookieNames: Object.keys(c),
    proto: req.headers['x-forwarded-proto'] || 'none',
    host: req.headers.host || 'none'
  });
});

// ── /login shortcut ───────────────────────────────────────────
// If the visitor already holds a valid pp_access JWT cookie AND the URL
// includes ?next=, skip rendering the form and go straight to the target.
// This eliminates the loop where the VR gate sent a logged-in user to
// /login?next=/journey/... and the page bounced them to /dashboard.
app.get(['/login', '/login.html'], (req, res, next) => {
  const token = req.cookies && req.cookies.pp_access;
  const dest  = typeof req.query.next === 'string' ? req.query.next : '';
  if (!token || !dest) return next();
  // Only follow safe local destinations (must start with a single '/').
  if (!/^\/[^/]/.test(dest)) return next();
  // pp_access is a VR-gate cookie, not a general auth cookie. Only bypass
  // the login form for VR/journey destinations. For /dashboard and other
  // Supabase-protected pages, let the login form load so it can verify the
  // Supabase session — otherwise a user whose Supabase token has expired
  // (but whose 30-day pp_access cookie is still valid) gets bounced in an
  // infinite loop: dashboard → /login?next=/dashboard → server 302 → dashboard.
  if (!dest.startsWith('/journey/') && !dest.startsWith('/pilgrimspath-vr')) return next();
  const secret = process.env.JWT_SECRET;
  if (!secret) return next();
  try {
    jwt.verify(token, secret);
    return res.redirect(302, dest);
  } catch { return next(); }
});

// ── Service Worker — must never be cached by the browser ─────
// Browsers use a byte-diff check to detect SW updates, but only if they
// actually fetch it. A stale HTTP cache would prevent that check entirely,
// locking users onto an old SW indefinitely.
app.get('/sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, 'sw.js'));
});

// ── Favicon ───────────────────────────────────────────────────
// Override the stale favicon.ico with the platform logo PNG
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'images', 'logo.png'));
});

// ── Static files ──────────────────────────────────────────────
// Serve everything from the project root as static
// Long cache for versioned assets, no-cache for HTML
app.use(express.static(__dirname, {
  maxAge: '7d',
  setHeaders(res, filePath) {
    // CRITICAL: explicit UTF-8 charset on every text response. Without this,
    // mobile browsers (especially iOS Safari) may parse JS/CSS as Windows-1252,
    // turning UTF-8 emoji bytes (F0 9F ...) into mojibake (ðŸ•Œ).
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    } else if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    }
    if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (/\/(auth|script|dashboard|admin-dashboard|lead-capture|meta-capi|journey-nav|journey-content-loader|scene-nav-overlay|journey-manager|admin-journey-content|quiz-content|journey-manager-content|button-catalog|panorama-catalog|generate-quiz-review|scene-landing-prompt)\.js(\?|$)/.test(filePath)) {
      // Critical auth + journey JS must always revalidate so security/auth fixes
      // reach users immediately instead of being stuck behind the 7-day cache.
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

// ── Clean URL support ─────────────────────────────────────────
// Redirect /page.html → /page (301 permanent)
app.use((req, res, next) => {
  if (req.path.endsWith('.html') && !req.path.startsWith('/api/')) {
    const clean = req.path.slice(0, -5) || '/';
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(301, clean + qs);
  }
  next();
});

// Serve /page → /page.html if the file exists
app.use((req, res, next) => {
  if (!path.extname(req.path) && req.path !== '/') {
    const htmlFile = path.join(__dirname, req.path + '.html');
    if (fs.existsSync(htmlFile)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.sendFile(htmlFile);
    }
  }
  next();
});

// Catch-all: unknown routes → 404 (don't serve index.html for API misses)
app.use((req, res) => {
  res.status(404).send('Not found');
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🕋 Pilgrim's Path server running on http://127.0.0.1:${PORT}`);
  console.log(`   NODE_ENV=${process.env.NODE_ENV || 'production'}`);
});
