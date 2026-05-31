# Pilgrim's Path — Master Agent Reference

## Project Overview
- **Name**: Pilgrim's Path — world's first free immersive VR Hajj & Umrah platform
- **Live site**: https://www.pilgrimspath.io
- **Stack**: Static HTML/CSS/JS + Node.js/Express (`server.js`) + Supabase (auth/DB) + Paystack (payments) + Meta Pixel/CAPI + 3DVista VR engine
- **GitHub**: branch `main` = production
- **Local workspace**: `/Users/el/Documents/pilgrimspath`

---

## Infrastructure

### Hosting (Hostinger VPS)
- **IP**: `72.61.19.238`  |  **User**: `root`  |  **Pass**: `hostINGER00@@`
- **App root on server**: `/var/www/pilgrimspath`
- **Port**: 3000 (behind nginx reverse proxy → https)
- **Process manager**: PM2 → `ecosystem.config.js`
- **Logs**: `pm2 logs pilgrimspath --lines 50`

### One-line deploy command
```bash
sshpass -p 'hostINGER00@@' ssh -o StrictHostKeyChecking=no root@72.61.19.238 \
  "cd /var/www/pilgrimspath && git pull origin main && pm2 restart pilgrimspath --update-env && pm2 status"
```

### Key env vars (`.env` on VPS)
| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Signs `pp_access` VR cookie + admin session cookie |
| `SUPABASE_URL` | `https://giftctxrqvlfekhzpcaa.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB writes (bypasses RLS) |
| `PAYSTACK_SECRET_KEY` | Payment verification |
| `PORT` | Default `3000` |

### Supabase
- **Project ref**: `giftctxrqvlfekhzpcaa`
- **Anon key**: in `auth.js` (line ~15) and `api/user-progress.js`
- **SQL Editor**: https://supabase.com/dashboard/project/giftctxrqvlfekhzpcaa/sql
- **Tables**: `profiles`, `transactions`, `user_progress`

### Admin route
`/sanctum-admin-7f3k9q2m` → serves `admin.html` (hidden URL, never link publicly)

---

## Authentication System (`auth.js`)

### Supabase client init
- Custom `_sbStorage` proxy in `auth.js` — checks `sessionStorage` first, then `localStorage`
- Controlled by `pp_remember_me` flag in localStorage
- `autoRefreshToken: true`, `detectSessionInUrl: true`

### Key functions
| Function | What it does |
|---|---|
| `getVerifiedSession()` | Gets session; if expiring within 5 min, calls `refreshSession()` first |
| `requireAuth()` | Returns user or redirects to `/login?next=<path>` |
| `redirectIfLoggedIn(dest)` | Used on login.html — bounces already-signed-in users |
| `ppGrantVrAccess(session)` | POSTs to `/api/grant-vr-access` to set `pp_access` cookie; retries once on 401 |
| `signOut()` | Clears Supabase session + storage |

### VR Access Cookie (`pp_access`)
- JWT signed with `JWT_SECRET`, issued by `/api/grant-vr-access`
- Required for ALL `/pilgrimspath-vr/**` routes (enforced in `server.js` middleware)
- 30-day expiry, `SameSite=Lax`, `HttpOnly`
- **Must be granted BEFORE navigating to a `/journey/*` URL** — dashboard and login both call `ppGrantVrAccess()` before redirecting

### Login loop prevention
- `login.html` has a loop guard: `sessionStorage._pp_auto_redirect_attempts:<dest>` counter
- If ≥ 2 attempts to same destination fail, shows error instead of redirecting again

---

## VR Journey Architecture

### URL structure
Clean alias `/journey/<slug>/<file>` → rewrites in `server.js` → real folder `/pilgrimspath-vr/pilgrims path main/<folder>/<file>`

**Slug map** (in `server.js` `JOURNEY_SLUG_MAP`):

| Slug | Real folder |
|---|---|
| `tawaf` | `1 Tawaf` |
| `sai` | `2 Safa and Marwa` |
| `ihram` | `0 Ihram` |
| `mina` | `3 Mina` |
| `arafah` | `4 Arafah` |
| `muzdalifah` | `Muzdalifah` |
| `jamarat-aqabah` | `Jamarat Aqabah` |
| `rami` | `5 Rami Jamarat, Qurbani, trim Shave, Tawaf` |
| `jamarat-rooftop` | `5 Rami Jamarat.../Jamarat rooftop` |
| `jamarat-base-12` | `Jamarat Base Day 12` |

### 16-step Hajj journey (defined in `journey-manager.js`)
Steps 1–16 map to: Tawaf → Sa'i → Umrah Trim → Rest → Re-enter Ihram → Mina (8th) → Arafah (9th) → Muzdalifah → Rami Aqabah (10th) → Qurbani → Barber → Tawaf Ifadha → Rami All (11th) → Mina Night → Rami All (12th) → Farewell Tawaf

### Journey state (localStorage)
```json
{ "currentStep": 7, "currentContext": "9th-day", "completedSteps": [1,2,3,4,5,6] }
```
Key: `journeyState`. Written by `JourneyManager.saveState()`, read on every page load.

### Scripts loaded in VR scenes
Every `index.htm` inside `/pilgrimspath-vr/` loads (relative paths, `../../` or `../../../`):
1. `journey-content-loader.js` (near top, NOT deferred — must run before TDV)
2. `journey-manager.js` (deferred)
3. `quiz-content.js` (deferred)
4. `journey-nav.js` (deferred)
5. `scene-landing-prompt.js` (deferred)
6. `scene-nav-overlay.js` (deferred) — sets `window._sceneNavBase` and `window._sceneNavCurrent` before the script tag

### Audio path convention
- Static (pre-production) voice-over files: `Hajj voiceover english/English/<filename>` (capital H — Linux is case-sensitive)
- Admin-uploaded files: served via `/api/journey-audio?file=en/<hash-name>.mp3`
- `playVO(file)` in each scene's `index.htm` resolves URLs via `window.PPContent.audioUrl(f)` if available, otherwise uses `/Hajj%20Voice%20Over/` fallback

### Arafah scene specifics
- Entry panorama ID: `panorama_84B0CD28_8BC4_4A0E_4196_9526145973A3` (force-jumped on load by `_arafahJumpEntry()`)
- Summit pano ID: `84B78C66` (shows the "Continue or Explore" landing prompt)
- File: `pilgrimspath-vr/pilgrims path main/4 Arafah/index.htm`
- Has `journey-manager.js` loaded (unlike some earlier scenes)

---

## Journey Content Manager (JCM)

### Overview
Admin tool at `/sanctum-admin-7f3k9q2m` → admin.html → `admin-journey-content.js`.
All edits made through the admin are **universal** — they go to the server and are fetched by every visitor on next page load.

### Architecture
```
Admin Dashboard (admin.html)
  └── admin-journey-content.js
        ├── POST /api/journey-content  → data/journey-content.json  (text/banners)
        └── POST /api/journey-audio    → data/audio/<lang>/<hash>.mp3  (audio)

journey-content-loader.js  (loaded in every VR scene)
  ├── Phase 1: reads localStorage (pp_journey_content_v2)  — synchronous
  └── Phase 2: GET /api/journey-content                    — async
               if serverSeed >= localSeed → overwrite local + re-fire scene
```

### Banner triggers
Each scene can have banners with these `trigger` values:
- `scene-load` — auto-plays when the scene loads
- `guide-screen-*` — auto-plays on guide overlay screens
- `button` — wired to a specific button element in the 3DVista scene
- `panorama` — fires when a specific panorama ID is entered
- `completion` — fires when `showJourneyNextButton()` is called

### Button wiring (`autoWireButtons()` in `journey-content-loader.js`)
`findButtonElement(buttonId, buttonLabel)` tries in order:
1. `document.getElementById(buttonId)`
2. `[data-pp-button="<buttonId>"]`
3. `.querySelector(buttonId)` if looks like a CSS selector
4. Text content match (normalized, 3 passes: exact → target-in-text → text-in-target)

**If a button banner isn't firing:** the `buttonId` or `buttonLabel` in the JCM doesn't match any element. Fix: add `data-pp-button="<id>"` to the button in the scene HTML, or correct the buttonId in the JCM to match.

### Auto-play logic (`getCurrentSceneVO()`)
Only these trigger types auto-play on scene load:
- `guide-screen-*`
- `scene-load`

Button/panorama banners do NOT auto-play — they only fire on user interaction.

### Data locations on VPS
| Path | Purpose |
|---|---|
| `data/journey-content.json` | Published content (text, banner config) |
| `data/audio/en/*.mp3` | English uploaded audio files |
| `data/audio/ar/*.mp3` | Arabic uploaded audio files |

`data/` is **not in git** — created on first API write. If missing on VPS, just trigger any Save from the admin to recreate it.

---

## Cross-Device Progress Sync

### Database table (`user_progress` — must exist in Supabase)
```sql
user_progress (
  user_id         UUID  PRIMARY KEY  -- auth.users.id
  journey_state   JSONB              -- { currentStep, currentContext, completedSteps[] }
  umrah_completed BOOLEAN
  updated_at      TIMESTAMPTZ
)
```
RLS enabled — users read/write only their own row. Service role key bypasses RLS for server writes.

### To create the table (run in Supabase SQL Editor)
```sql
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    journey_state   JSONB    NOT NULL DEFAULT '{"currentStep":0,"currentContext":"","completedSteps":[]}'::jsonb,
    umrah_completed BOOLEAN  NOT NULL DEFAULT false,
    updated_at      TIMESTAMPTZ      DEFAULT NOW()
);
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users read own progress"   ON public.user_progress;
DROP POLICY IF EXISTS "Users write own progress"  ON public.user_progress;
CREATE POLICY "Users read own progress"  ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users write own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON public.user_progress (user_id);
```

### API endpoints
- `GET /api/user-progress` — returns `{ journey_state, umrah_completed }` or 204 if no record
- `POST /api/user-progress` — upserts user row (merge-duplicates)
- Both require `Authorization: Bearer <supabase-user-jwt>`

### How sync works in browser
- On every step advance → `JourneyManager.saveState()` → writes localStorage + fires `POST /api/user-progress` (fire-and-forget, never blocks)
- On page load → `JourneyManager.loadState()` → phase 1 reads localStorage synchronously → phase 2 `GET /api/user-progress` async → if server step > local step, overwrites localStorage + fires `jm:synced` CustomEvent
- `dashboard.html` listens for `jm:synced` → calls `window._applyJourneyProgress()` to re-render progress cards

---

## Key Files Quick Reference

| File | Purpose |
|---|---|
| `server.js` | Express entry point — mounts all `api/*.js` handlers, VR gate, static file serving, URL rewrites |
| `auth.js` | Supabase auth client, `requireAuth`, `ppGrantVrAccess`, `getVerifiedSession` |
| `journey-manager.js` | 16-step Hajj journey state, `saveState/loadState`, server sync |
| `journey-nav.js` | Injects progress dots + "Next Stop →" button in VR scenes |
| `journey-content-loader.js` | Loads JCM content, `autoWireButtons`, `getCurrentSceneVO`, `boot()` |
| `scene-nav-overlay.js` | Scene navigation overlay (prev/next scene arrows + map) |
| `admin-journey-content.js` | Admin dashboard JCM editor |
| `dashboard.html` | User dashboard — shows Journey/Umrah/Hajj cards, certificate |
| `api/journey-content.js` | GET/POST published content JSON |
| `api/journey-audio.js` | POST upload + GET serve audio files |
| `api/user-progress.js` | GET/POST cross-device journey progress |
| `api/grant-vr-access.js` | Issues `pp_access` cookie after Supabase JWT verification |
| `supabase-setup.sql` | All DB table creation SQL (run in Supabase SQL Editor) |

---

## Common Fixes & Gotchas

### Dashboard in a loop
Most likely cause: `user_progress` table doesn't exist → `/api/user-progress` returns 500 → auth retries loop.
**Fix**: Run the `user_progress` SQL above in Supabase SQL Editor. Confirm with `curl`:
```bash
curl -s -o /dev/null -w "%{http_code}" \
  "https://giftctxrqvlfekhzpcaa.supabase.co/rest/v1/user_progress?limit=1" \
  -H "apikey: <anon_key>" -H "Authorization: Bearer <anon_key>"
# Should return 200
```

### VR login loop (`/journey/*` → `/login` → `/journey/*`)
Caused by `pp_access` cookie not being set before navigation.
**Fix**: Always `await ppGrantVrAccess()` before `window.location.href = vrUrl`. `login.html` loop guard (sessionStorage counter) aborts after 2 failed attempts and shows an error instead of looping.

### Button VO not playing in a scene
1. Check admin JCM: the banner card should show green ☁ badge (server URL), not orange (base64 = localStorage only)
2. Open browser console — look for `[PPContent] button not found for banner "..."` warning
3. If warning present: `buttonId` in JCM doesn't match the DOM. Add `data-pp-button="<id>"` to the button element in the scene's `index.htm`, or fix the buttonId in JCM to match
4. `autoWireButtons()` is called in `boot()` AND retried by a `MutationObserver` — so late-rendering 3DVista buttons are covered

### Audio path case sensitivity
`Hajj voiceover english/English/` — capital H and capital E. Linux VPS is case-sensitive. Wrong case = 404.

### `data/` folder missing on VPS
`data/journey-content.json` and `data/audio/` are created on first API write. If missing: log into admin, open JCM, click Save once.

### Deploying after changes
```bash
git add -A && git commit -m "description" && git push origin main
sshpass -p 'hostINGER00@@' ssh -o StrictHostKeyChecking=no root@72.61.19.238 \
  "cd /var/www/pilgrimspath && git pull origin main && pm2 restart pilgrimspath --update-env"
```

---

## Journey Content Manager — How It Works

### Overview

The Journey Content Manager (JCM) is the admin tool for editing every VR scene's
banners, text, audio, panorama references, and button wiring.  All changes made
through the admin dashboard are now **universal** — editing on any computer,
any browser, propagates to every visitor of the experience.

Separately, **user journey progress** is synced to the server so a logged-in user
sees the same progress on any device they log in from.

---

## Architecture

```
Admin Dashboard (admin.html)
       │
       │  save / upload
       ▼
api/journey-content.js  ──writes──▶  data/journey-content.json   (text content)
api/journey-audio.js    ──writes──▶  data/audio/<lang>/<file>     (audio files)
       │                                         │
       │  GET on every page load                 │
       ▼                                         ▼
journey-content-loader.js          Served via GET /api/journey-audio?file=<lang>/<name>
       │
       ▼
All VR / journey pages (hajj-journey.html, umrah-journey.html, etc.)


User Journey Progress (cross-device)
──────────────────────────────────────
journey-manager.js  (root + pilgrimspath-vr/)
       │  saveState() called on every step/advance
       ├──▶ localStorage.setItem('journeyState', ...)   ← instant, always available
       └──▶ POST /api/user-progress                     ← async, fire-and-forget

       │  loadState() called on page load
       ├──▶ localStorage.getItem('journeyState')        ← phase 1: synchronous, fast
       └──▶ GET /api/user-progress                      ← phase 2: async merge
              │  (fires 'jm:synced' event when done)
              ▼
       dashboard.html  window._applyJourneyProgress()   ← re-runs on 'jm:synced'
```

---

## Content Storage — `data/journey-content.json`

### Written by
`POST /api/journey-content` — admin JWT required.

Triggered automatically every time the admin clicks **Save** in the JCM.

### Read by
- `GET /api/journey-content` — called by `journey-content-loader.js` on every
  page load (cache: no-store) so visitors always see the latest published content.
- `admin-journey-content.js` — also reads on admin dashboard load to pull the
  latest server version before rendering the editor.

### Fallback chain
1. Server returns 200 → use server data, update localStorage cache
2. Server returns 204 (nothing published yet) or network error → fall back to
   localStorage (`pp_journey_content_v2`)
3. localStorage empty → use built-in DEFAULT_DATA seed

### Versioning
Each content object carries a `seedVersion` integer.  The loader only adopts
server data if `serverSeed >= localSeed`.  The admin increments this number
automatically on every migrate/seed operation.

---

## Audio Storage — `data/audio/<lang>/<hash-named-file>`

### Written by
`POST /api/journey-audio` — admin JWT required.

Body (JSON):
```json
{
  "filename": "day1-tawaf.mp3",
  "lang":     "en",
  "data":     "data:audio/mpeg;base64,..."
}
```

Response:
```json
{
  "ok":           true,
  "filename":     "day1-tawaf-a3f9c12d.mp3",
  "originalName": "day1-tawaf.mp3",
  "lang":         "en",
  "url":          "/api/journey-audio?file=en/day1-tawaf-a3f9c12d.mp3"
}
```

Audio upload flow in the admin:
1. Admin clicks the **upload** button on a banner card
2. A file picker opens; the selected file is read as a base64 Data URI
3. The Data URI is POSTed to `/api/journey-audio`
4. The server saves the binary to `data/audio/<lang>/<hash-name>.<ext>` so the
   same audio is never duplicated even if uploaded twice
5. The returned URL (`/api/journey-audio?file=...`) is stored in the content
   JSON (`banner.audio[lang]`), replacing any previous value
6. The original filename is stored in `banner.audio[lang+'_name']` for display
   in the admin UI (so you see "day1-tawaf.mp3" not a raw URL)
7. Admin clicks **Save** → content JSON (with the URL, not base64) is pushed to
   the server and all devices pick it up on next load

### Read by
`GET /api/journey-audio?file=<lang>/<filename>`

- Path-traversal protected (rejects `..` segments)
- Served with `Cache-Control: public, max-age=31536000, immutable`
  (files are hash-named so they never change but new uploads get new hashes)

### Why hash-naming?
Uploaded audio is saved as `<stem>-<first12charsOfSHA256>.<ext>`.
This means:
- Uploading the same file twice returns the same URL (idempotent)
- Different files never collide
- Browser/CDN caching is safe forever

---

## How Sync Works

### On Admin Save
```
admin-journey-content.js  save()
  1. Write full data to localStorage     ← instant, local preview still works
  2. POST /api/journey-content           ← async, syncs to server
     ├─ success → flash "Saved & synced to server ✓"
     └─ fail    → flash "⚠ Saved locally — server sync failed" (orange warning)
```

### On Visitor / Admin Page Load
```
journey-content-loader.js  boot()
  1. Read localStorage (pp_journey_content_v2)  ← synchronous, fast render
  2. Fetch GET /api/journey-content              ← async
     ├─ 204 / error → keep localStorage data
     └─ 200 → compare seedVersion
              ├─ server >= local → replace data, update localStorage, re-fire scene
              └─ server < local  → keep local (shouldn't happen, but safe)
```

---

## File Locations on the VPS

| Path | Purpose |
|---|---|
| `/var/www/pilgrimspath/data/journey-content.json` | Published content JSON |
| `/var/www/pilgrimspath/data/audio/en/*.mp3` | English uploaded audio |
| `/var/www/pilgrimspath/data/audio/ar/*.mp3` | Arabic uploaded audio |
| `/var/www/pilgrimspath/api/journey-content.js` | Content API route |
| `/var/www/pilgrimspath/api/journey-audio.js` | Audio upload/serve route |

The `data/` directory is **not committed to git**.  It is created on first use
by the API endpoints (`fs.mkdirSync(dir, { recursive: true })`).

---

## Admin UI Indicators

| Badge / Colour | Meaning |
|---|---|
| ☁ **Server: filename.mp3** (green) | Audio saved on server — works on all devices |
| ⚠ orange warning (base64) | Old-format audio stored only in your browser's localStorage |
| Path label (no badge) | Static audio from the `/Hajj voiceover english/` folder |
| "Saved & synced to server ✓" flash | Content successfully written to server |
| "⚠ Saved locally — server sync failed" flash | Saved to localStorage only; check server |

---

## Adding a New Language

1. Open the admin dashboard → **Journey Content Manager**
2. Click **+ Add language** in the language switcher bar
3. Add translations for each banner in the new language tab
4. Click **Save** — the language list AND content are synced to the server
5. All visitors see the new language switcher immediately (loaded via
   `/api/journey-languages`)

---

## Security

- All write endpoints (`POST /api/journey-content`, `POST /api/journey-audio`)
  require a valid admin JWT cookie (`pp_admin_session`)
- `GET /api/journey-content` is public (just JSON, no secrets)
- `GET /api/journey-audio` is public but path-traversal protected (`..` rejected)
- Request body size limits: 25 MB for audio endpoints, 2 MB for content JSON

---

## Troubleshooting

**"Content I saved isn't showing on another device"**
Check the flash message after saving.  If it shows "⚠ server sync failed",
the POST to `/api/journey-content` failed.  Check PM2 logs: `pm2 logs pilgrimspath`.

**"Uploaded audio isn't playing"**
The banner card should show the green ☁ badge.  If it shows orange (base64),
the upload failed — re-upload.  If the badge is green but audio doesn't play,
check that `data/audio/` exists and is writable on the VPS.

**"Admin dashboard loads old content"**
The dashboard fetches the server version on load.  If the server has no content
yet (`data/journey-content.json` doesn't exist), it returns 204 and the editor
falls back to localStorage (which IS the source of truth until the first Save).
Click **Save** once to push the current localStorage state to the server.

---

## User Journey Progress Sync

### Overview

Journey progress (`currentStep`, `currentContext`, `completedSteps`, plus the
`pp_umrah_completed` flag) is persisted in Supabase via `api/user-progress.js`.
A logged-in user with progress on device A will see the same progress on device B
the moment they open the dashboard.

### Database Table — `user_progress`

Run the SQL in `supabase-setup.sql` (bottom section) in the Supabase SQL Editor
to create the table before this feature is used.

```sql
user_progress (
  user_id         UUID  PRIMARY KEY  -- Supabase auth.users.id
  journey_state   JSONB             -- { currentStep, currentContext, completedSteps[] }
  umrah_completed BOOLEAN
  updated_at      TIMESTAMPTZ
)
```

RLS is enabled.  Users can only read and write their own row.

### API — `GET /api/user-progress`

- **Auth**: `Authorization: Bearer <supabase-user-jwt>`
- Returns `{ journey_state, umrah_completed }` — or **204** if no record yet.

### API — `POST /api/user-progress`

- **Auth**: `Authorization: Bearer <supabase-user-jwt>`
- Body: `{ journey_state: { currentStep, currentContext, completedSteps }, umrah_completed }`
- Upserts (merge-duplicate) the user's row.  Returns `{ ok: true }`.

### How Sync Works in the Browser

**On every step advance (`saveState()`):**
```
journey-manager.js
  1. localStorage.setItem('journeyState', ...)    ← instant, never blocked
  2. _pushToServer() — fire-and-forget POST        ← async, no await
```

**On every page load (`loadState()`):**
```
journey-manager.js
  Phase 1 (sync):  read localStorage → populate this.currentStep etc.
  Phase 2 (async): GET /api/user-progress
    ├─ no JWT / 204 → do nothing
    └─ server step > local step (or more completedSteps)
         → override localStorage + instance
         → dispatch window.CustomEvent('jm:synced', { detail: { didUpdate: true } })
```

**Dashboard re-render:**
```
dashboard.html
  window._applyJourneyProgress()   ← runs immediately on page load (localStorage)
  window.addEventListener('jm:synced', ...)
    └─ if didUpdate → window._applyJourneyProgress()  ← re-runs with server data
```

### JWT Extraction (works without auth.js)

VR scene pages (3DVista `index.htm` files) do not load `auth.js`.
`_getJwt()` in `journey-manager.js` reads the Supabase token directly from
storage using the key `sb-giftctxrqvlfekhzpcaa-auth-token`, so sync works in
VR scenes too.

### `pp_umrah_completed` Flag

This boolean lives in localStorage and is set by various HTML pages.  Rather
than modifying every page, the sync layer:
- Reads it from localStorage and includes it in every POST
- Syncs it **bidirectionally** — sets it when the server says `true`, and
  **removes it** from localStorage when the server says `false` (e.g. after a
  reset). (Fixed: previously the flag was only written, never cleared.)

### Reset Entire Experience — `pp_just_reset` Guard

When the user triggers **Reset Entire Experience** (in-VR menu) or **Reset
Progress** (profile page), the handler:

1. Removes all progress keys from localStorage (`journeyState`, `pp_quiz_scores`,
   `pp_cert_awarded_at`, `pp_hajj_certified*`, `pp_umrah_completed`, etc.)
2. Sets `localStorage.setItem('pp_just_reset', '1')` — this key is **not** in
   the cleared list so it survives the page navigation
3. POSTs zeroed state to `/api/user-progress`
4. Navigates away (after POST resolves)

On the first `_pullFromServer()` call after the reset:
- The function sees `pp_just_reset` → removes it → returns immediately (skips
  the GET)
- Prevents the race condition where `GET /api/user-progress` returns stale data
  before the reset POST settles in the DB
- Subsequent page loads call `_pullFromServer()` normally (flag is gone) and see
  the server's already-zeroed state

### File Locations on the VPS

| Path | Purpose |
|---|---|
| `/var/www/pilgrimspath/api/user-progress.js` | Progress read/write endpoint |
| `/var/www/pilgrimspath/journey-manager.js` | Root journey manager (all HTML pages) |
| `/var/www/pilgrimspath/pilgrimspath-vr/journey-manager.js` | VR scene journey manager |

### Troubleshooting

**Progress not syncing to another device**
Check that the `user_progress` table has been created in Supabase (run the SQL
in `supabase-setup.sql`).  Also check `pm2 logs pilgrimspath` for errors from
`api/user-progress.js`.

**Dashboard progress ring not updating after server sync**
Open DevTools → Console.  You should see `[JourneyManager] Initialized` and the
`jm:synced` event should fire ~1 second later.  If it doesn't, check the network
tab for `/api/user-progress` — a 401 means the JWT wasn't found in storage.

---

## Scene-Level Fixes (VR `index.htm` files)

These are permanent patches applied directly to specific 3DVista scene files.
They correct behaviour that the CMS layer cannot configure.

### Sa'i — Canonical Panorama IDs (`_buildSMBannerMaps`)

**File**: `pilgrimspath-vr/pilgrims path main/2 Safa and Marwa/index.htm`

**Problem**: `PPContent.bannerMapByPano()` / `audioMapByPano()` look up banners
using the panorama IDs stored in `data/journey-content.json`.  If an admin ever
edits or re-saves a banner in the JCM, the stored IDs can change and banners fire
on the wrong panorama (or never fire at all).

**Fix (commit 24377865)**: Added a `_SM_CANON` map of hardcoded canonical IDs:
```js
var _SM_CANON = {
  'sm-pano-1': 'panorama_740A042A_7348_ED6D_41CA_00F715E5C1F1',
  'sm-pano-2': 'panorama_740A504C_7348_2525_41D3_C8D1BB48BC81',
  'sm-pano-3': 'panorama_77BBA118_7348_272D_41C8_26E405934981'
};
```
`_buildSMBannerMaps()` uses `PPContent.byId()` (lookup by CMS `id` field, not
panorama key) + the canonical IDs above to build `_bannerMap` / `_audioMap`.
This makes Sa'i banner triggers immune to admin CMS edits.

Called in both initial `boot()` setup and inside `_ppGuideContentRefresh`.

---

### Mina — 8th-Day Mode: Next Stop after Congrats Banner

**File**: `pilgrimspath-vr/pilgrims path main/3 Mina/index.htm`

**Problem**: In 8th-day mode the "Congratulations" banner fired on the tent
panorama (`MINA_LANDING_8TH`) but `showJourneyNextButton` was only called when
`id === MINA_LANDING_8TH`.  If 3DVista navigated to `TENT_PANO` (e.g. the user
had previously visited the tent), the **Next Stop** button never appeared.

**Fix (commit c133b9e0)**: Extended the `showJourneyNextButton` condition in
`_minaFireBannerVO()`:
```js
// Before:
if (id === MINA_LANDING_8TH) { showJourneyNextButton(); }
// After:
if (id === MINA_LANDING_8TH || (id === TENT_PANO && !IS_TENT_MODE)) { showJourneyNextButton(); }
```

---

### Arafah — Congrats Panorama Handler (`ar-pano-congrats`)

**File**: `pilgrimspath-vr/pilgrims path main/4 Arafah/index.htm`

**Problem**: No `_bannerMap` / `_audioMap` existed for Arafah, so panorama-
triggered banners (including the congratulations banner at `panorama_84B7F067`)
never fired via `chk()`.

**Fix (commit c133b9e0)**:
- Added `_bannerMap` and `_audioMap` variables populated from
  `PPContent.bannerMapByPano('arafah-9th')` / `audioMapByPano('arafah-9th')`
- Added a dedicated `chk()` handler for panorama `84B7F067` (`ar-pano-congrats`):
  - Displays the CMS congrats banner if configured
  - Sets `journeyIsLastPanorama = true`
  - Calls `showJourneyNextButton` so the journey can advance
- `_ppGuideContentRefresh` now rebuilds both maps when content refreshes
