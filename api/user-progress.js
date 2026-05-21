// api/user-progress.js
// Per-user journey progress persistence — synced across all devices.
//
// GET  /api/user-progress
//   Auth: Authorization: Bearer <supabase-user-jwt>
//   Returns: { journey_state: {...}, umrah_completed: bool }
//   Returns 204 when no progress record exists yet.
//
// POST /api/user-progress
//   Auth: Authorization: Bearer <supabase-user-jwt>
//   Body: { journey_state: {...}, umrah_completed: bool }
//   Returns: { ok: true }

'use strict';

const SUPABASE_URL  = process.env.SUPABASE_URL  || 'https://giftctxrqvlfekhzpcaa.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZnRjdHhycXZsZmVraHpwY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg0NjQsImV4cCI6MjA4ODI5NDQ2NH0.Dm4tb6lvLMf9CDLo04qA9msYVLjBT-Web48pgk0BOYc';

// --- CORS helper (same pattern as other api/ files) --------------------------
function setCors(req, res) {
  const origin  = req.headers.origin || '';
  const allowed = [
    'https://www.pilgrimspath.io', 'https://pilgrimspath.io',
    'http://localhost:3000', 'http://127.0.0.1:3000'
  ];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// --- JWT verification via Supabase -------------------------------------------
// Calls /auth/v1/user with the user's JWT to confirm it is valid and get user.id
async function verifyJwt(jwt) {
  try {
    const r = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + jwt }
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u : null;
  } catch (_) { return null; }
}

// --- Supabase REST helpers ---------------------------------------------------
// Uses the service role key when available (bypasses RLS), otherwise falls back
// to authenticating as the user via their JWT (requires RLS policies to exist).
function dbHeaders(userJwt) {
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const key    = svcKey ? svcKey : SUPABASE_ANON;
  const bearer = svcKey ? svcKey : userJwt;
  return {
    'apikey':        key,
    'Authorization': 'Bearer ' + bearer,
    'Content-Type':  'application/json',
    'Accept':        'application/json'
  };
}

// =============================================================================
module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Extract JWT from Authorization header
  const authHeader = req.headers.authorization || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!jwt) return res.status(401).json({ error: 'Unauthorized' });

  // Verify JWT and get the user id
  const user = await verifyJwt(jwt);
  if (!user || !user.id) return res.status(401).json({ error: 'Unauthorized' });

  const userId  = user.id;
  const hdrs    = dbHeaders(jwt);

  // ── GET: return the user's saved progress ────────────────────────────────
  if (req.method === 'GET') {
    try {
      const r = await fetch(
        SUPABASE_URL + '/rest/v1/user_progress?select=journey_state,umrah_completed&user_id=eq.' + userId,
        { headers: hdrs }
      );
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        console.warn('[UserProgress] GET failed', r.status, txt);
        return res.json({ journey_state: {}, umrah_completed: false });
      }
      const rows = await r.json();
      if (!rows || rows.length === 0) return res.status(204).end();
      return res.json({
        journey_state:   rows[0].journey_state  || {},
        umrah_completed: !!rows[0].umrah_completed
      });
    } catch (e) {
      console.error('[UserProgress] GET error:', e.message);
      return res.json({ journey_state: {}, umrah_completed: false });
    }
  }

  // ── POST: upsert the user's progress ────────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body || {};

    // Sanitise — only accept plain objects, not arbitrary JS
    const journey_state = (body.journey_state && typeof body.journey_state === 'object')
      ? {
          currentStep:    Number(body.journey_state.currentStep)  || 0,
          currentContext: String(body.journey_state.currentContext || ''),
          completedSteps: Array.isArray(body.journey_state.completedSteps)
            ? body.journey_state.completedSteps.filter(x => Number.isInteger(x))
            : []
        }
      : { currentStep: 0, currentContext: '', completedSteps: [] };

    const umrah_completed = !!body.umrah_completed;

    try {
      const r = await fetch(SUPABASE_URL + '/rest/v1/user_progress', {
        method:  'POST',
        headers: { ...hdrs, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          user_id:         userId,
          journey_state,
          umrah_completed,
          updated_at:      new Date().toISOString()
        })
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        console.warn('[UserProgress] POST failed', r.status, txt);
        return res.status(500).json({ error: 'Save failed' });
      }
      return res.json({ ok: true });
    } catch (e) {
      console.error('[UserProgress] POST error:', e.message);
      return res.status(500).json({ error: 'Save failed' });
    }
  }

  return res.status(405).end();
};
