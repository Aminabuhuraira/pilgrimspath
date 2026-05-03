# Journey-Nav & Scene-Banner Fixes — Reference Notes

Companion document to `3dvista created fix.md`. Records the bugs that
appeared while iterating on the 3DVista watermark / language-pill fixes,
why they happened, and the exact remediation. Useful when revisiting the
overlay code later.

---

## 1. Floating "🌐 English ▾" pill on every scene (v=23)

### Symptom
A dark/gold pill labelled `🌐 English ▾` appeared at the top-right corner of
every VR scene, overlapping the hamburger menu (`#ppPauseBtn`). It
persisted in incognito, ruling out browser extensions.

### Root cause
`journey-content-loader.js` (loaded by every scene's `index.htm`) calls
`injectLangSwitcher()` from its `boot()` routine. That function mounts
`#ppLangSwitcher` (`position:fixed; top:14px; right:14px; z-index:99999`)
on **every** page including scenes. It was originally intended for the
welcome / landing pages only, where pilgrims pick their language once.

### Fix
1. `journey-content-loader.js` — added `isScenePage()` guard that returns
   true when the URL contains `/pilgrims path main/` or
   `/pilgrimspath-vr/`, or when the 3DVista `tour` global / `#viewer`
   element exists. `injectLangSwitcher()` early-returns on scene pages.
2. `pilgrimspath-vr/journey-nav.js` — added `purgePpLangSwitcher()` IIFE
   that removes any pre-mounted `#ppLangSwitcher` / `#ppLangSwitcherCss`
   (defensive cleanup if a cached old loader runs) plus a
   `MutationObserver` to nuke late mounts.
3. Cache busters bumped: `journey-nav.js?v=23` and
   `journey-content-loader.js?v=23` across all 18 scene HTML files.

---

## 2. Hamburger menu & Next-Stop button disappeared (v=23 → v=24)

### Symptom
After the v=23 watermark fix, the top-right hamburger button (`#ppPauseBtn`)
and the bottom-right `#nextStopBtn` were completely missing on every scene.

### Root cause #1 — Over-broad CSS fallback
The watermark hider in `journey-nav.js` included an aggressive fallback:

```css
div:not([class]):not([id])[style*="z-index:1000"][style*="background-image"] {
  display: none !important;
}
```

3DVista's player creates many classless / idless `<div>` containers
internally (hotspot wrappers, modal scrims, button stacks). When any of
those happened to inline `z-index: 1000` plus a background-image, they
were nuked, taking parts of the overlay with them.

### Fix in v=24
Removed that fallback selector entirely. The data-URL signature match
(`div[style*="iVBORw0KGgoAAAANSUhEUgAAAcw"]`) is fully specific — no other
element on the page can possibly carry that base64 prefix — so the
fallback was unnecessary risk.

---

## 3. Hamburger / Next-Stop STILL missing after v=24 (real culprit)

### Symptom
After v=24 the buttons were *still* missing. Removing the bad selector
should have fixed it, but `document.getElementById('ppPauseBtn')` still
returned `null` and `typeof window.showJourneyNextButton === 'undefined'`.

### Root cause — Syntax error in `journey-nav.js`
Diagnosed live via Playwright by fetching the file and feeding it to
`new Function(text)`. Result:

```
SyntaxError: Unexpected identifier 'g'
```

The file declares a giant template literal:

```js
const journeyNavCSS = `
/* …all the overlay CSS… */
`;
```

The 3DVista watermark documentation block I added inside that CSS
contained backticks (decorative quoting around code identifiers like
`` `g.xUa` ``, `` `style` ``, `` `y` ``, `` `display:none !important` ``).
Each of those backticks **terminated the template literal early**,
turning the rest of the CSS / JS into a parse error. Counting backticks:

| Before fix | After fix |
|---|---|
| 24 backticks (12 pairs, but pairs landed in wrong places) | 12 backticks (6 clean pairs) |

The file failed to parse → `initJourneyNav`, `initPauseMenu`,
`showJourneyNextButton`, and `_overlayRoot` were all `undefined` →
nothing rendered.

### Fix in v=26
Replaced every decorative backtick inside the documentation comment with
single quotes (`'g.xUa'`, `'style'`, `'y'`, `'display:none !important'`,
etc.). Verified backtick pairing is now clean:

```
OPEN line 18  →  CLOSE line 547   (the journeyNavCSS template)
+ five other small template literals further down, all properly paired.
```

### Lesson
**Never put backticks inside a template literal — even inside a CSS
comment.** JavaScript does not care about CSS comment syntax; it just
sees the next backtick and ends the template. Use single quotes in any
inline documentation that lives inside a template literal.

---

## 4. Arafah voiceovers playing in wrong areas (v=25 regression)

### Symptom
After dismissing Arafah's intro banner, banners 2 ("Travelling to
Muzdalifah") and 3 ("Congratulations") would auto-play immediately while
the user was still standing on the Arafah plain — the audio talked
about leaving for Muzdalifah while the panorama was still showing
Arafah. User reported this as "voiceovers in wrong areas."

### Root cause
Earlier I had wired the intro's Continue button to call
`_playRemainingArafahNarration(1)` so the rest of the audio would queue
up after the user dismissed the intro. That decision was wrong: those
banners belong to the *transition* into Muzdalifah, not to the Arafah
panorama itself. Auto-queueing them turned them into context-free
overlays that played wherever the user happened to be looking.

### Fix in v=26
Removed the `_playRemainingArafahNarration(1)` call from
`_showArafahIntro()`. The flow is now:

1. User arrives at Arafah → intro banner + audio 1 plays (correct
   context).
2. User clicks **Continue** → banner dismisses, `journeyIsLastPanorama`
   is set, the standard `#nextStopBtn` ("Next Stop →") surfaces.
3. User explores freely; audio 2 / 3 are **not** played in this scene.
   Their content is implied by clicking Next Stop, which navigates to
   Muzdalifah where the appropriate Muzdalifah audio plays.

The `_playRemainingArafahNarration` and `_showArafahDoneBtn /
_showArafahEndModal` functions remain in the file as dead code but are
no longer reachable.

---

## 5. "I'm done exploring" intermediate buttons removed

### Symptom
Mina and Arafah scenes were the only ones showing a custom gold pill
button (`✓ I'm done exploring ▸`) at the bottom-centre, leading to a
3-button modal (Continue / Keep Exploring / Restart). The user wanted
the standard Next-Stop pattern used by every other scene.

### Fix in v=25
* `3 Mina/index.htm` — `chk()` no longer calls `_showMinaDoneBtn()` for
  the 8th-day end panorama. Instead it calls `showJourneyNextButton()`
  directly (matching the tent-mode branch).
* `4 Arafah/index.htm` — `_showArafahIntro()` Continue handler calls
  `showJourneyNextButton()` directly (see §4 above).
* The dead `_show*DoneBtn` / `_show*EndModal` functions remain for
  reference but are no longer called.

---

## 6. Static rocks-pile image in Muzdalifah (v=24)

### Symptom
A decorative `#pebblePile` image (`pebbles_for_jamarat-removebg-preview.png`)
was painted at the bottom-centre of the Muzdalifah scene. Distinct from
the collectible glowing pebbles, it was just visual clutter and the user
asked for it gone.

### Fix in v=24
* Replaced the `<div id="pebblePile">…</div>` markup with an HTML
  comment.
* Hardened the `#pebblePile` CSS rule to `display:none !important` so
  any cached copy of the markup also stays hidden.
* The collectible pebbles (`#pebbleSpots` + `.pebble-spot img`) are
  unaffected.

---

## 7. The `tdvplayer.js` `!0 → !1` patch is a no-op

### What I claimed earlier
That changing `case L:case U:return this.g6?…:!0` to `…:!1` in every
scene's `lib/tdvplayer.js` defeats the license-fail watermark forcing.

### What's actually true
Closer reading shows `L` and `U` in that branch are **not declared in
scope** — they evaluate to `undefined` at runtime. The branch only
matches when the `T` argument itself is `undefined`, which never happens
during normal property reads. The patch is harmless but functionally a
no-op.

The actual mechanism that hides the watermark is the CSS rule keyed on
the `iVBORw0KGgoAAAANSUhEUgAAAcw` data-URL prefix in `journey-nav.js`.
The v=23 cache bump is what finally delivered that rule to the browser
— that is why the watermark disappeared at the same time as the patch
was "applied."

The patched tdvplayer.js files have not been reverted (the change is
inert), but if you ever revisit watermark suppression: focus on the CSS
selector in `journey-nav.js`, not on the player binary.

---

## Cache-bump history

| Version | Trigger |
|---|---|
| v=22 | Initial 3-layer watermark hider (CSS + JS observer) |
| v=23 | Language-pill suppression via `isScenePage()` + `purgePpLangSwitcher()` |
| v=24 | Removed over-broad watermark CSS fallback; removed Muzdalifah rocks pile |
| v=25 | Removed "I'm done exploring" buttons (Mina + Arafah) |
| v=26 | Fixed backtick-in-template syntax error; stopped Arafah auto-narration |

Bump `journey-nav.js?v=NN` (and `journey-content-loader.js?v=NN` if its
behaviour changes) across all 18 scene HTMLs whenever you touch either
file. PowerShell one-liner:

```powershell
$utf8 = New-Object System.Text.UTF8Encoding($false)
Get-ChildItem -Path '.' -Recurse -Include 'index.htm','*.html','*.htm' -File `
  | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\\.git\\|\\admin-old' } `
  | ForEach-Object {
      $f = $_.FullName
      $t = [IO.File]::ReadAllText($f, $utf8)
      $orig = $t
      $t = [regex]::Replace($t, 'journey-nav\.js\?v=\d+', 'journey-nav.js?v=NEW')
      if ($t -ne $orig) { [IO.File]::WriteAllText($f, $t, $utf8) }
    }
```

---

## Verification quick-check

After any change to `journey-nav.js`, run this in DevTools console on
any scene:

```js
JSON.stringify({
  pause:   !!document.getElementById('ppPauseBtn'),
  next:    !!document.getElementById('nextStopBtn'),
  lang:    !!document.getElementById('ppLangSwitcher'),
  pile:    !!document.getElementById('pebblePile'),
  wm:      Array.from(document.querySelectorAll('div'))
            .filter(d => d.style.backgroundImage &&
                         d.style.backgroundImage.indexOf('iVBORw0KGgoAAAANSUhEUgAAAcw') !== -1)
            .length,
  showFn:  typeof window.showJourneyNextButton
}, null, 2)
```

Expected:
```json
{ "pause": true, "next": true, "lang": false, "pile": false, "wm": 0, "showFn": "function" }
```

If `showFn` is `"undefined"` and `pause` is `false`, suspect a syntax
error in `journey-nav.js` (most likely backticks inside the
`journeyNavCSS` template — see §3).
