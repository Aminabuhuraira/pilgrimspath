# VR Login Loop — Root Cause & Fix

**Date:** 2026-05-17
**Severity:** Critical — every signed-in user was blocked from entering the VR experience.
**Symptom report:** "Clicking *Begin Virtual Tour* sends me back to the login page, and a toast says *Could not establish VR session*."

---

## Symptom

1. User signs in successfully (Supabase JWT is issued and stored).
2. Dashboard / Hajj-VR page calls `POST /api/grant-vr-access` with the Supabase access token in the `Authorization: Bearer …` header.
3. The endpoint returns **`401 {"error":"Invalid Supabase session"}`**.
4. Because the `pp_access` cookie is never set, the next request to `/journey/<slug>/index.htm` hits the `requireVrAccess` gate, which 302-redirects to `/login?next=…`.
5. Login page sees the user is already signed in, tries to grant VR again, gets 401 again — **infinite ping-pong**.

## False trails (what wasn't actually broken)

We burned several rounds on incorrect hypotheses, all client-side:

| Suspect | Why it looked guilty | Why it wasn't the cause |
|---|---|---|
| Stale Service Worker cache | First report mentioned "old page came back". | Cache-nuke v36 ran; symptom persisted. |
| Stale Supabase session in `localStorage` | Token age ≈ 23 h, near 24 h refresh window. | Added `getVerifiedSession()` to refresh; still 401. |
| `pp_access_ok=1` sentinel cookie left behind from earlier session | Auto-redirect IIFE saw stale sentinel and skipped grant. | Removed sentinel logic; still 401. |
| Login page calling `signOut()` when grant failed | Closed the loop by destroying the very session needed. | Patched (commit 92934792), but root cause still upstream. |
| `ppGrantVrAccess` not retrying on token refresh | Added one-shot refresh+retry. | Retry also returned 401. |

All five client patches were defensible, none of them fixed it, because the server was rejecting **every** token regardless of freshness.

## How we actually found the cause

Built a self-contained activity monitor (`debug-monitor.js`, dashboard at `/debug-vr.html`) that captures
console, click, fetch, navigation, auth-state, and cookie events to `localStorage` so the user can hand
back a single log dump.

The smoking gun in the dump:

```
[09:01:04] AUTH  SIGNED_IN   access_token expires_in=3600
[09:01:08] FETCH POST /api/grant-vr-access  ->  401
            body: {"error":"Invalid Supabase session"}
```

Four seconds between a healthy `SIGNED_IN` and the 401 made it clear the token itself was fine —
the **server's verification of the token** was failing.

We then added detailed Supabase-rejection logging to `api/grant-vr-access.js` (commit 92934792):

```js
// on Supabase /auth/v1/user failure:
console.error('[grant-vr-access] Supabase verify failed', {
  supabase_status: r.status,
  supabase_body:   bodyPreview,
  token_prefix:    token.slice(0, 12),
  apikey_len:      (process.env.SUPABASE_ANON_KEY || '').length
});
```

The next failing request printed:

```
supabase_status: 401
supabase_body:   {"message":"Invalid API key"}
apikey_len:      6
```

`apikey_len: 6` was the answer. The real Supabase anon key is **226 characters** — a JWT. Six characters means the server was sending literally `eyJ...` as the API key.

## Root cause

The server's `/var/www/pilgrimspath/.env` contained the literal placeholder from `.env.template`:

```env
SUPABASE_ANON_KEY=eyJ...
```

It had never been replaced with the real key. The PM2 process was happily loading `eyJ...` (6 chars) and sending it as the `apikey` header on every call to `https://<project>.supabase.co/auth/v1/user`. Supabase rejected with **401 Invalid API key** for every single user, every single time.

Verification on the VPS:

```bash
ssh root@<vps> "awk -F= '/^SUPABASE_ANON_KEY=/{print \"len=\"length(\$2)}' /var/www/pilgrimspath/.env"
# len=6
```

## The fix

```bash
ssh root@<vps> "sed -i 's|^SUPABASE_ANON_KEY=eyJ\\.\\.\\.\$|SUPABASE_ANON_KEY=<real-226-char-anon-key>|' /var/www/pilgrimspath/.env"
ssh root@<vps> "pm2 restart pilgrimspath --update-env"
```

`--update-env` is mandatory — PM2 caches `.env` at process spawn, so a plain `pm2 restart` would
re-launch with the stale six-character key.

Post-fix verification:

```bash
ssh root@<vps> "awk -F= '/^SUPABASE_ANON_KEY=/{print \"len=\"length(\$2)}' /var/www/pilgrimspath/.env"
# len=226
```

User confirmed the VR experience now loads.

## Why CI / deploy missed it

- `.env` is (correctly) in `.gitignore`, so the placeholder was a once-only error made when the file was
  first hand-created on the VPS from `.env.template`.
- No server-side startup validation on env var length / format.
- The error happened deep inside `grant-vr-access`'s upstream call to Supabase, which originally just
  returned a generic 401 to the client — no clue what was actually wrong.

## Prevention — recommended follow-ups

1. **Fail fast on bad env at boot.** In `server.js`, validate critical secrets on startup and refuse
   to listen if any are obvious placeholders:

   ```js
   const REQUIRED = {
     JWT_SECRET:                v => v && v.length >= 32,
     SUPABASE_URL:              v => /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(v),
     SUPABASE_ANON_KEY:         v => v && v.length > 100 && v.startsWith('eyJ'),
     SUPABASE_SERVICE_ROLE_KEY: v => v && v.length > 100 && v.startsWith('eyJ'),
   };
   for (const [k, ok] of Object.entries(REQUIRED)) {
     if (!ok(process.env[k])) {
       console.error(`[boot] FATAL: env ${k} is missing or looks like a placeholder`);
       process.exit(1);
     }
   }
   ```

2. **Keep the detailed Supabase rejection log** (commit 92934792). The single most useful diagnostic
   we added — surfaces real upstream messages instead of a generic 401.

3. **Keep the activity monitor**. `/debug-vr.html` + `debug-monitor.js` (gated by
   `localStorage.pp_debug_enabled='1'`) was the only thing that bridged "user reports vague symptom"
   and "engineer sees actual fetch responses". Reusable for the next murder mystery.

4. **Do not call `signOut()` on grant failure.** Killing the user's Supabase session because *our*
   server can't verify it sends them to a broken login state. Show a contact-support message instead.

## Files involved

- [server.js](server.js) — `requireVrAccess` gate, journey rewrite middleware
- [api/grant-vr-access.js](api/grant-vr-access.js) — added rejection logging
- [auth.js](auth.js) — `ppGrantVrAccess` with refresh + retry
- [login.html](login.html) — `autoRedirect`, no longer signs out on grant failure
- [debug-monitor.js](debug-monitor.js) — session-wide event recorder
- [debug-vr.html](debug-vr.html) — live activity dashboard
- `/var/www/pilgrimspath/.env` (server-only, not in git) — **the actual fix**

## Commit trail

- `d152aa34` — fix(auth): refresh expired Supabase token before VR grant *(client-side, didn't fix)*
- `a64b2f62` — feat(debug): live activity dashboard at /debug-vr.html *(the diagnostic that cracked it)*
- `92934792` — debug(grant-vr): log Supabase rejection details + stop sign-out on grant fail
- *(no commit)* — sed replacement of `SUPABASE_ANON_KEY` placeholder on VPS + `pm2 restart --update-env` *(the actual fix)*
