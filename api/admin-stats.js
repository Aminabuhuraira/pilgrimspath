// api/admin-stats.js
// Secure admin-only endpoint that returns live Supabase data for the admin
// dashboard.
//
// Strategy (tried in order):
//  1. Supabase RPC function get_pp_admin_stats() -- uses SECURITY DEFINER to
//     bypass RLS, called with the anon key + ADMIN_API_TOKEN as parameter.
//     Requires one-time SQL setup in Supabase Dashboard (see supabase-setup.sql).
//  2. Service-role direct REST -- falls back to SUPABASE_SERVICE_ROLE_KEY if
//     the RPC is not installed yet.
//  3. Not configured -- returns a helpful setup guide JSON.
//
// Always gated by the pp_admin_session cookie.
'use strict';

const jwt = require('jsonwebtoken');

// ---- Auth helper ----------------------------------------------------------
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
  } catch (e) { return false; }
}

// ---- Supabase config ------------------------------------------------------
const SUPA_URL = process.env.SUPABASE_URL || 'https://giftctxrqvlfekhzpcaa.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZnRjdHhycXZsZmVraHpwY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg0NjQsImV4cCI6MjA4ODI5NDQ2NH0.Dm4tb6lvLMf9CDLo04qA9msYVLjBT-Web48pgk0BOYc';

async function sbFetchWithKey(path, key, opts) {
  opts = opts || {};
  const url = SUPA_URL + '/rest/v1' + path;
  const headers = Object.assign({
    'apikey': key, 'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json', 'Prefer': 'count=exact'
  }, opts.headers || {});
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) {
    console.warn('[admin-stats] Supabase error:', res.status,
      await res.text().catch(function() { return ''; }));
    return null;
  }
  const rangeHeader = res.headers.get('content-range') || '';
  const totalCount = parseInt((rangeHeader.split('/')[1] || ''), 10);
  const rows = await res.json();
  if (Array.isArray(rows)) rows._count = isNaN(totalCount) ? rows.length : totalCount;
  return rows;
}

// ---- Shared mappers -------------------------------------------------------
function profileToUser(p) {
  const first = (p.first_name || '').trim();
  const last  = (p.last_name  || '').trim();
  const name  = (p.display_name || '').trim() ||
                (first + ' ' + last).trim() ||
                (p.email || '').split('@')[0] || 'User';
  const joined = (p.created_at || '').split('T')[0] || '';
  var lastActive = '--', status = 'inactive';
  if (p.last_sign_in_at) {
    const days = Math.floor((Date.now() - new Date(p.last_sign_in_at).getTime()) / 86400000);
    lastActive = days === 0 ? 'Today' : days + 'd ago';
    status = days < 7 ? 'active' : days < 30 ? 'inactive' : 'churned';
  }
  return {
    name: name, email: p.email || '', country: p.country || '',
    plan: p.plan || 'Free', joined: joined, lastActive: lastActive,
    status: status, createdAt: p.created_at || ''
  };
}

function mapTx(t) {
  return {
    date: (t.paid_at || t.created_at || '').split('T')[0] || '--',
    user: t.email || 'Unknown',
    type: (t.type || 'purchase').replace(/(^.|-.)/g, function(v) {
      return v.replace('-', ' ').toUpperCase();
    }),
    plan: t.plan || '--',
    amount: (t.currency || 'USD') + ' ' + Number(t.amount || 0).toFixed(2),
    amountNum: Number(t.amount || 0),
    currency: t.currency || 'USD',
    status: (t.status || 'completed').toLowerCase(),
    paid_at: t.paid_at || t.created_at || ''
  };
}

// ---- Strategy 1: SECURITY DEFINER RPC (anon key + ADMIN_API_TOKEN) -------
// Requires get_pp_admin_stats() SQL function in Supabase (see supabase-setup.sql).
async function tryRpcStrategy(adminToken) {
  if (!adminToken || adminToken.length < 8) return null;
  try {
    const res = await fetch(SUPA_URL + '/rest/v1/rpc/get_pp_admin_stats', {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_admin_token: adminToken })
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.code || !data.configured) return null;

    const users = (data.users || []).map(profileToUser);
    const transactions = (data.transactions || []).map(mapTx);
    const completed = transactions.filter(function(t) { return t.status === 'completed'; });
    return {
      configured: true,
      users: users,
      leadsCount: data.leadsCount || 0,
      recentLeads: (data.recentLeads || []).map(function(l) {
        return { email: l.email || '', source: l.source || 'site', created_at: l.created_at || '' };
      }),
      transactions: transactions,
      revenue: completed.reduce(function(s, t) { return s + t.amountNum; }, 0),
      revenueHistory: data.revenueHistory || {}
    };
  } catch (e) {
    console.warn('[admin-stats] RPC strategy failed:', e.message);
    return null;
  }
}

// ---- Strategy 2: Service-role direct REST --------------------------------
async function tryServiceRoleStrategy() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey || serviceKey.length < 100) return null;
  try {
    const results = await Promise.all([
      sbFetchWithKey('/profiles?select=*&order=created_at.desc&limit=500', serviceKey),
      sbFetchWithKey('/leads?select=id&limit=1', serviceKey),
      sbFetchWithKey('/leads?select=email,created_at,source&order=created_at.desc&limit=10', serviceKey),
      sbFetchWithKey('/transactions?select=reference,email,amount,currency,status,type,plan,source,paid_at,created_at&order=paid_at.desc&limit=200', serviceKey)
    ]);
    const profileRows = results[0], leadsCountRows = results[1];
    const recentLeadRows = results[2], txRows = results[3];
    const users = (profileRows || []).map(profileToUser);
    const leadsCount = (leadsCountRows && typeof leadsCountRows._count === 'number')
      ? leadsCountRows._count : (leadsCountRows ? leadsCountRows.length : 0);
    const recentLeads = (recentLeadRows || []).map(function(l) {
      return { email: l.email || '', source: l.source || 'site', created_at: l.created_at || '' };
    });
    const transactions = (txRows || []).map(mapTx);
    const completed = transactions.filter(function(t) { return t.status === 'completed'; });
    const revenue = completed.reduce(function(s, t) { return s + t.amountNum; }, 0);
    const revenueHistory = {};
    completed.forEach(function(t) {
      const d = new Date(t.paid_at || '');
      if (isNaN(d.getTime())) return;
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      revenueHistory[key] = (revenueHistory[key] || 0) + t.amountNum;
    });
    return {
      configured: true, users: users, leadsCount: leadsCount,
      recentLeads: recentLeads, transactions: transactions,
      revenue: revenue, revenueHistory: revenueHistory
    };
  } catch (e) {
    console.warn('[admin-stats] service role strategy failed:', e.message);
    return null;
  }
}

// ---- Main handler ---------------------------------------------------------
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAdminAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

  const adminToken = process.env.ADMIN_API_TOKEN || '';

  // 1. Try SECURITY DEFINER RPC (works once SQL is run in Supabase Dashboard)
  const rpcResult = await tryRpcStrategy(adminToken);
  if (rpcResult) return res.status(200).json(rpcResult);

  // 2. Fall back to service-role direct REST
  const srResult = await tryServiceRoleStrategy();
  if (srResult) return res.status(200).json(srResult);

  // 3. Neither worked -- return setup instructions
  const srKeySet = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length >= 100;
  const hint = adminToken && adminToken.length > 4
    ? adminToken.substring(0, 4) + '...'
    : 'YOUR_TOKEN';
  return res.status(200).json({
    configured: false,
    setupRequired: true,
    message: srKeySet
      ? 'SUPABASE_SERVICE_ROLE_KEY set but queries failed -- verify it is the service_role JWT, not the anon key.'
      : 'Run supabase-setup.sql in Supabase Dashboard, then run the set_config command shown in sqlHint.',
    sqlHint: "SELECT set_config('app.pp_admin_token', '" + hint + "', false);"
  });
};
