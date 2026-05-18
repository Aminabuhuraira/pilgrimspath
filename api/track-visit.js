// api/track-visit.js
// Lightweight page-view beacon — called from every public page.
// POST /api/track-visit  { page, referrer, ua }
// Saves to Supabase page_views table (anon insert policy allows it).
// Never blocks the browser — called with navigator.sendBeacon or fetch(keepalive).
'use strict';

const { applyCors } = require('./_security');

const SUPA_URL = process.env.SUPABASE_URL || 'https://giftctxrqvlfekhzpcaa.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZnRjdHhycXZsZmVraHpwY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg0NjQsImV4cCI6MjA4ODI5NDQ2NH0.Dm4tb6lvLMf9CDLo04qA9msYVLjBT-Web48pgk0BOYc';

// Simple in-memory rate limiter keyed by IP (per minute)
const _rl = new Map();
function rateOk(ip) {
  const now = Date.now();
  const win = 60000;
  const max = 60; // 60 page views/min per IP is very generous
  const entry = _rl.get(ip) || { count: 0, start: now };
  if (now - entry.start > win) { _rl.set(ip, { count: 1, start: now }); return true; }
  entry.count++;
  _rl.set(ip, entry);
  return entry.count <= max;
}

module.exports = async function handler(req, res) {
  if (!applyCors(req, res, 'POST, OPTIONS')) return;
  if (req.method !== 'POST') return res.status(204).end();

  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (!rateOk(ip)) return res.status(204).end(); // silently drop, don't error

  const body = req.body || {};
  let page = String(body.page || '/').slice(0, 500);
  const referrer = String(body.referrer || '').slice(0, 500);
  const ua = String(req.headers['user-agent'] || '').slice(0, 300);

  // Strip query strings and fragments from page path for clean grouping
  try { page = new URL('https://x.com' + page).pathname; } catch (_) {}

  // Skip admin-only paths
  if (page.startsWith('/sanctum-admin') || page.startsWith('/api/')) {
    return res.status(204).end();
  }

  try {
    await fetch(SUPA_URL + '/rest/v1/page_views', {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ page, referrer, ua, visited_at: new Date().toISOString() })
    });
  } catch (e) {
    console.warn('[track-visit] save failed:', e.message);
  }

  // Always respond quickly so the beacon doesn't slow down the page
  res.status(204).end();
};
