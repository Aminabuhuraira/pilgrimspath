// api/admin-stats.js
// Secure admin-only endpoint that returns live Supabase data for the admin
// dashboard. Uses the SUPABASE_SERVICE_ROLE_KEY (server-only) to bypass RLS.
// Gated by the pp_admin_session cookie set by /api/admin-auth.
'use strict';

const jwt = require('jsonwebtoken');

// ── Auth helper identical to admin-auth-check.js ─────────────────────────
function isAdminAuthed(req) {
  let token = req.cookies && req.cookies.pp_admin_session;
  if (!token) {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/(?:^|;\s*)pp_admin_session=([^;]+)/);
    token = match ? match[1] : null;
  }
  const jwtSecret = process.env.JWT_SECRET;
  if (!token || !jwtSecret) return false;
  try {
    const p = jwt.verify(token, jwtSecret);
    return p.role === 'admin';
  } catch { return false; }
}

// ── Supabase REST helper (service-role, bypasses RLS) ────────────────────
async function sbFetch(path, opts = {}) {
  const url = `${process.env.SUPABASE_URL}/rest/v1${path}`;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key || key.length < 100) return null; // key not configured
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact',
      ...opts.headers
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    console.warn('[admin-stats] Supabase error:', res.status, err);
    return null;
  }
  const rangeHeader = res.headers.get('content-range') || '';
  const totalCount = parseInt((rangeHeader.split('/')[1] || ''), 10);
  const rows = await res.json();
  if (Array.isArray(rows)) rows._count = isNaN(totalCount) ? rows.length : totalCount;
  return rows;
}

function profileToUser(p) {
  const first = (p.first_name || '').trim();
  const last  = (p.last_name  || '').trim();
  const name  = (p.display_name || '').trim() ||
                `${first} ${last}`.trim() ||
                (p.email || '').split('@')[0] || 'User';
  const joined = (p.created_at || '').split('T')[0] || '';
  let lastActive = '—';
  let status = 'inactive';
  if (p.last_sign_in_at) {
    const days = Math.floor((Date.now() - new Date(p.last_sign_in_at).getTime()) / 86400000);
    lastActive = days === 0 ? 'Today' : days + 'd ago';
    status = days < 7 ? 'active' : days < 30 ? 'inactive' : 'churned';
  }
  return {
    name, email: p.email || '',
    country: p.country || '',
    plan: p.plan || 'Free',
    joined, lastActive, status,
    createdAt: p.created_at || ''
  };
}

module.exports = async function handler(req, res) {
  // Only GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Must be admin
  if (!isAdminAuthed(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey || serviceKey.length < 100) {
    // Service key not configured — return empty envelope so dashboard
    // falls back gracefully and shows setup instructions
    return res.status(200).json({
      configured: false,
      message: 'SUPABASE_SERVICE_ROLE_KEY is not set in server .env. Add it to enable live admin analytics.',
      users: [],
      leadsCount: 0,
      recentLeads: [],
      transactions: [],
      revenue: 0,
      revenueHistory: {}
    });
  }

  try {
    // Run queries in parallel
    const [profileRows, leadsCountRows, recentLeadRows, txRows] = await Promise.all([
      sbFetch('/profiles?select=*&order=created_at.desc&limit=500'),
      sbFetch('/leads?select=id&limit=1'),
      sbFetch('/leads?select=email,created_at,source&order=created_at.desc&limit=10'),
      sbFetch('/transactions?select=reference,email,amount,currency,status,type,plan,source,paid_at,created_at&order=paid_at.desc&limit=200')
    ]);

    // --- Users ---
    const users = (profileRows || []).map(profileToUser);

    // --- Leads ---
    const leadsCount = leadsCountRows && typeof leadsCountRows._count === 'number'
      ? leadsCountRows._count
      : (leadsCountRows ? leadsCountRows.length : 0);
    const recentLeads = (recentLeadRows || []).map(l => ({
      email: l.email || '',
      source: l.source || 'site',
      created_at: l.created_at || ''
    }));

    // --- Transactions ---
    const transactions = (txRows || []).map(t => ({
      date: (t.paid_at || t.created_at || '').split('T')[0] || '—',
      user: t.email || 'Unknown',
      type: (t.type || 'purchase').replace(/(^.|-.)/g, v => v.replace('-', ' ').toUpperCase()),
      plan: t.plan || '—',
      amount: `${t.currency || 'USD'} ${Number(t.amount || 0).toFixed(2)}`,
      amountNum: Number(t.amount || 0),
      currency: t.currency || 'USD',
      status: (t.status || 'completed').toLowerCase(),
      paid_at: t.paid_at || t.created_at || ''
    }));

    // --- Revenue aggregation ---
    const completed = transactions.filter(t => t.status === 'completed');
    const revenueTotal = completed.reduce((s, t) => s + t.amountNum, 0);

    // Monthly revenue map { 'YYYY-MM': total }
    const revenueHistory = {};
    completed.forEach(t => {
      const d = new Date(t.paid_at || '');
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueHistory[key] = (revenueHistory[key] || 0) + t.amountNum;
    });

    return res.status(200).json({
      configured: true,
      users,
      leadsCount,
      recentLeads,
      transactions,
      revenue: revenueTotal,
      revenueHistory
    });
  } catch (e) {
    console.error('[admin-stats] error:', e);
    return res.status(500).json({ error: 'Internal error fetching stats', detail: e.message });
  }
};
