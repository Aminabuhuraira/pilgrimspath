# Mojibake Fix — Banner Emoji Corruption on Mobile

**Date:** 11 May 2026
**Severity:** P0 — User-facing UI corruption affecting all mobile devices
**Status:** Fixed

---

## TL;DR

Banner titles like `🕌 Welcome to the Sacred House` were rendering as
`ðŸ•Œ Welcome to the Sacred House` on mobile devices. Cause: the server
(both Vercel **and** the Hostinger nginx) was serving JavaScript files with
**no `charset` parameter** in the `Content-Type` header. Mobile browsers —
particularly iOS Safari and Chrome on Android — fall back to **Windows-1252**
in that case, byte-decoding UTF-8 multi-byte emoji into Latin-1 mojibake.
A subsequent `SEED_VERSION` bump then **wrote those mojibake strings back
into every device's `localStorage`**, making it look much worse.

---

## Symptoms

- Emoji (🕌, 🌙, ✨, 🕋) in banner titles displayed as `ðŸ•Œ`, `ðŸŒ™`, etc.
- Some devices showed it, others did not — looked like a serving issue.
- After the v23 SEED bump it appeared on **all** mobile devices simultaneously.
- The Rest scene and Re-enter Ihram scene were unaffected because their
  scene-keys (`rest-umrah`, `reenter-ihram`) are not present in admin
  `DEFAULT_DATA`, so they never merge from `PPContent` and always render
  their hardcoded `\uXXXX` escape strings.

---

## Root Cause Chain

1. **`admin-journey-content.js` source** is a UTF-8 file containing literal
   emoji bytes such as `F0 9F 95 8C` (🕌).
2. **The server** (Vercel preview + nginx in production) returned these JS
   files as:
    ```
    Content-Type: application/javascript          ← no charset
    Content-Type: text/plain                      ← worse, also no charset
    ```
3. **Per the HTML spec**, when a `<script>` is fetched without a charset and
   the loading document doesn't share an origin/encoding hint, the browser
   may default to the system's legacy encoding. Desktop browsers usually
   pick UTF-8; **mobile browsers frequently pick Windows-1252**.
4. Bytes `F0 9F 95 8C` decoded as Windows-1252 produce **U+00F0 U+0178
   U+2022 U+0152** = `ðŸ•Œ`. The JS engine sees these as the literal
   characters of the string.
5. `DEFAULT_DATA` is now mojibake **in JS memory** on the affected device.
6. The seed-version logic detects the bumped `SEED_VERSION` and resyncs
   `localStorage` from this corrupted `DEFAULT_DATA`, **persisting the
   corruption**.
7. Every banner read returns the corrupted string from `localStorage`. The
   output-layer mojibake guard (`_MOJI_RE`) does not help because *the
   defaults themselves are now corrupt* — there is no clean fallback.

### Why device-dependent

`localStorage` is per-browser-profile. Devices that decoded the JS as UTF-8
got clean data; devices that decoded as Windows-1252 got mojibake. The
seed-version bump unified the bad outcome by overwriting every device's
storage from the (locally mis-decoded) `DEFAULT_DATA`.

---

## The Fix (defense in depth — five independent layers)

### 1. Vercel — explicit `Content-Type` per extension
[vercel.json](vercel.json) — added per-extension headers so Vercel always
emits `; charset=utf-8` for `.js`, `.mjs`, `.css`, `.json`, `.html`, `.htm`.

### 2. Nginx — global `charset utf-8` directive
[deploy/nginx.conf](deploy/nginx.conf) — added `charset utf-8;` and
`charset_types` covering JS, CSS, JSON, SVG, plain text. Nginx now appends
`; charset=utf-8` to every text response automatically.

### 3. Express — `setHeaders` per file extension
[server.js](server.js) — `express.static`'s `setHeaders` callback now sets
explicit `Content-Type: …; charset=utf-8` for every text/JS/CSS/HTML/JSON/SVG
file, in case anything bypasses nginx and hits the Node origin directly.

### 4. UTF-8 BOM prepended to critical JS files
The byte sequence `EF BB BF` (UTF-8 BOM) was prepended to every script that
contains DEFAULT_DATA or user-facing emoji. **Per ECMA-262 §11.1, browsers
treat a file beginning with the UTF-8 BOM as UTF-8 regardless of any HTTP
header.** This is the bulletproof guarantee.

Files with BOM:
- [admin-journey-content.js](admin-journey-content.js)
- [journey-content-loader.js](journey-content-loader.js)
- [journey-manager.js](journey-manager.js)
- [journey-nav.js](journey-nav.js)
- [pilgrimspath-vr/journey-nav.js](pilgrimspath-vr/journey-nav.js)
- [pilgrimspath-vr/quiz-content.js](pilgrimspath-vr/quiz-content.js)
- [pilgrimspath-vr/scene-nav-overlay.js](pilgrimspath-vr/scene-nav-overlay.js)
- [pilgrimspath-vr/journey-manager.js](pilgrimspath-vr/journey-manager.js) (already had BOM)

### 5. `SEED_VERSION` 23 → 24 forced re-seed
[admin-journey-content.js](admin-journey-content.js#L14) — bumped
`SEED_VERSION` and `FORCE_RESET_ALL_BELOW_SEED` to 24. On first page load
after deploy, every device wipes its (potentially corrupted) `localStorage`
and re-seeds from `DEFAULT_DATA`. Combined with the now-correct UTF-8
delivery, this re-seed is guaranteed clean.

The output-layer mojibake guard in [journey-content-loader.js](journey-content-loader.js#L43)
(`_MOJI_RE`, `_clean()`, `_cleanBanner()`) and the load-time scan
([line 100](journey-content-loader.js#L100)) remain in place as a safety net
that returns empty strings (forcing the scene's hardcoded `\uXXXX` fallback)
if any mojibake somehow reaches the runtime in future.

---

## Verification

After deploy, confirm with:

```bash
curl -sI https://pilgrimspath.io/admin-journey-content.js | grep -i content-type
# Expected: content-type: application/javascript; charset=utf-8

curl -sI https://pilgrimspath.io/journey-content-loader.js | grep -i content-type
# Expected: content-type: application/javascript; charset=utf-8

# Verify BOM (EF BB BF) on first 3 bytes:
curl -s https://pilgrimspath.io/admin-journey-content.js | head -c 3 | xxd
# Expected: 00000000: efbb bf
```

On a previously-affected mobile device:
1. Hard reload the VR scene.
2. DevTools → Application → Local Storage → confirm `pp_journey_content_v2`
   has `seedVersion: 24` and contains literal emoji (🕌) not `ðŸ•Œ`.
3. Banners render with correct emoji.

---

## Lessons / Prevention

- **Always declare charset.** Every text response should carry an explicit
  `charset=utf-8`. Don't rely on browser defaults — they vary by platform.
- **Add a UTF-8 BOM to any source file containing non-ASCII literals**
  whose encoding interpretation matters. It costs 3 bytes and removes an
  entire class of ambiguity.
- **Don't mass-resync user data from defaults that haven't been validated
  end-to-end.** A `SEED_VERSION` bump turned a few-device problem into an
  all-device problem.
- **Keep `\uXXXX` escape fallbacks** in scene-side hardcoded `BANNERS`
  so the runtime always has a clean source of truth even if dynamic data
  is corrupted.
