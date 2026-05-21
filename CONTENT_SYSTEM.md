# Journey Content Manager — How It Works

## Overview

The Journey Content Manager (JCM) is the admin tool for editing every VR scene's
banners, text, audio, panorama references, and button wiring.  All changes made
through the admin dashboard are now **universal** — editing on any computer,
any browser, propagates to every visitor of the experience.

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
