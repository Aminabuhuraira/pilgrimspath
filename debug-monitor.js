// debug-monitor.js — Pilgrim's Path session-wide activity recorder.
// Auto-loaded by auth.js when localStorage.pp_debug_enabled === '1'.
// Installs lightweight hooks that persist events to localStorage so the
// /debug-vr.html dashboard can show what happened across redirects,
// navigations, and the auth/VR-grant flow.
//
// Storage:
//   localStorage._pp_debug_events  : JSON array, capped at 800 entries
//   localStorage._pp_debug_session : tab/session id (random per tab)
//
// Each event: { t: ISO timestamp, page: pathname, kind: string, data: any }

(function () {
  if (window.__ppDebugMonitorInstalled) return;
  window.__ppDebugMonitorInstalled = true;

  var STORE_KEY   = '_pp_debug_events';
  var SESSION_KEY = '_pp_debug_session';
  var MAX_EVENTS  = 800;

  // ── Session ID (per tab) ───────────────────────────────────
  var sessionId;
  try {
    sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).slice(2, 8) + '_' + Date.now();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
  } catch (e) { sessionId = 'sess_nostore'; }

  function _shortStr(v, max) {
    max = max || 400;
    try {
      var s = typeof v === 'string' ? v : JSON.stringify(v, function (k, val) {
        if (val instanceof Error) return { name: val.name, message: val.message, stack: (val.stack || '').slice(0, 200) };
        if (typeof val === 'function') return '[fn ' + (val.name || 'anon') + ']';
        return val;
      });
      if (s && s.length > max) s = s.slice(0, max) + '…';
      return s;
    } catch (e) { return String(v).slice(0, max); }
  }

  function pushEvent(kind, data) {
    try {
      var arr = [];
      try { arr = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) {}
      arr.push({
        t: new Date().toISOString(),
        sess: sessionId,
        page: location.pathname + location.search,
        kind: kind,
        data: data
      });
      if (arr.length > MAX_EVENTS) arr = arr.slice(-MAX_EVENTS);
      localStorage.setItem(STORE_KEY, JSON.stringify(arr));
    } catch (e) { /* localStorage full or blocked — silent */ }
  }
  window.__ppDebugPush = pushEvent;

  // ── Page load marker ───────────────────────────────────────
  pushEvent('pageload', {
    url: location.href,
    referrer: document.referrer || null,
    ua: navigator.userAgent.slice(0, 80)
  });

  // ── Cookie snapshot ────────────────────────────────────────
  function cookieSnapshot() {
    var raw = document.cookie || '';
    var names = raw ? raw.split(';').map(function (s) { return s.trim().split('=')[0]; }) : [];
    return {
      names: names,
      hasPpAccessOk: /(?:^|;\s*)pp_access_ok=1/.test(raw),
      count: names.length
    };
  }
  pushEvent('cookies', cookieSnapshot());

  // ── Console interception ───────────────────────────────────
  ['log', 'warn', 'error', 'info'].forEach(function (level) {
    var orig = console[level];
    console[level] = function () {
      try {
        var args = Array.prototype.slice.call(arguments).map(function (a) { return _shortStr(a, 200); });
        pushEvent('console.' + level, args.join(' '));
      } catch (e) {}
      return orig.apply(console, arguments);
    };
  });

  // ── Unhandled errors ───────────────────────────────────────
  window.addEventListener('error', function (e) {
    pushEvent('error', {
      msg: e.message,
      src: (e.filename || '').replace(location.origin, ''),
      line: e.lineno,
      col: e.colno,
      stack: e.error && e.error.stack ? String(e.error.stack).slice(0, 300) : null
    });
  });
  window.addEventListener('unhandledrejection', function (e) {
    pushEvent('error.promise', {
      reason: _shortStr(e.reason && (e.reason.message || e.reason), 300)
    });
  });

  // ── Click capture (links + buttons) ────────────────────────
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var el = t.closest('a, button, [onclick], [role=button]');
    if (!el) return;
    var info = {
      tag: el.tagName,
      text: (el.textContent || '').trim().slice(0, 60),
      href: el.getAttribute('href') || null,
      onclick: el.getAttribute('onclick') || null,
      id: el.id || null,
      cls: (el.className || '').toString().slice(0, 80)
    };
    pushEvent('click', info);
  }, true);

  // ── Navigation tracking ────────────────────────────────────
  window.addEventListener('beforeunload', function () {
    pushEvent('unload', { to: 'pending', cookies: cookieSnapshot() });
  });

  // ── window.location intercept (best-effort) ────────────────
  // location.href = ... is a setter — we can't override directly, but most
  // app code reads it. We can wrap pushState / replaceState / assign / replace.
  try {
    var _assign = location.assign.bind(location);
    var _replace = location.replace.bind(location);
    location.assign = function (url) { pushEvent('nav.assign', { url: String(url) }); return _assign(url); };
    location.replace = function (url) { pushEvent('nav.replace', { url: String(url) }); return _replace(url); };
  } catch (e) {}
  var _push = history.pushState;
  var _rep  = history.replaceState;
  history.pushState    = function () { try { pushEvent('history.push', { url: String(arguments[2] || '') }); } catch (e){} return _push.apply(history, arguments); };
  history.replaceState = function () { try { pushEvent('history.replace', { url: String(arguments[2] || '') }); } catch (e){} return _rep.apply(history, arguments); };

  // ── fetch interception (captures /api/* + cookie flow) ─────
  var _fetch = window.fetch;
  window.fetch = async function (input, init) {
    var url, method;
    try {
      if (typeof input === 'string') { url = input; method = (init && init.method) || 'GET'; }
      else { url = input.url; method = input.method || 'GET'; }
    } catch (e) { url = '(unknown)'; method = '?'; }
    var t0 = Date.now();
    var evtBase = { method: method, url: String(url).replace(location.origin, '') };
    try {
      var res = await _fetch.apply(this, arguments);
      var dur = Date.now() - t0;
      // Clone so we don't lock the body for the real caller
      var bodyPreview = null;
      var isInteresting = /\/api\/|grant-vr|paystack|debug-cookies/.test(url);
      if (isInteresting) {
        try {
          var clone = res.clone();
          var txt = await clone.text();
          bodyPreview = txt.slice(0, 200);
        } catch (e) {}
      }
      pushEvent('fetch', Object.assign({}, evtBase, {
        status: res.status,
        ms: dur,
        ok: res.ok,
        body: bodyPreview
      }));
      return res;
    } catch (err) {
      pushEvent('fetch.error', Object.assign({}, evtBase, {
        ms: Date.now() - t0,
        err: _shortStr(err && err.message, 200)
      }));
      throw err;
    }
  };

  // ── Auth state hook (best-effort) ──────────────────────────
  // auth.js exposes onAuthStateChange — call it once if available
  if (typeof window.onAuthStateChange === 'function') {
    try {
      window.onAuthStateChange(function (event, session) {
        pushEvent('auth.state', {
          event: event,
          user: session && session.user && session.user.email || null,
          expires_at: session && session.expires_at || null
        });
      });
    } catch (e) {}
  }

  pushEvent('monitor.installed', { session: sessionId });
})();
