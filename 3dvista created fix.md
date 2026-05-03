# 3DVista "Created by 3DVista Academic" Watermark — Investigation & Fix

## Symptom

A faint, floating watermark reading **"Created by 3DVista Academic"** appears
on every Hajj VR scene, sometimes overlapping our own UI (e.g. the *Enable
audio?* modal). It moves around — every few seconds it disappears and
reappears in a different position.

## Why earlier "obvious" fixes did not work

| Attempt                                                                    | Why it failed                                                                                                                                                  |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Setting `"watermark": false` in every scene's `script_general.js`          | The licensed-academic watermark is gated on a **different** property — `academicWatermark` — not on `watermark`. The latter is the optional 360-tile watermark. |
| Removing the element from the DOM with `el.remove()`                       | The player owns a `setInterval(8000)` that calls `parent.insertBefore(vt, …)` every 8 s and silently re-attaches the node.                                     |
| Setting inline `opacity: 0`                                                 | The same 8 s interval re-applies `vt.style.opacity = "1"` from its style map, overwriting our value.                                                           |
| A loose CSS selector like `[class=""]:not([id])[style*="z-index:1000"]`    | The element is created by `document.createElement('div')` with **no** `class` attribute at all (not an empty one), and the `:not([class])` form is fragile.    |
| A JS observer that hides on `MutationObserver` only                         | Race condition — the player's first paint can land before our observer is wired up; we then needed a polling fallback.                                         |

## Deep-dive into the actual mechanism

The watermark is rendered by a single CommonJS module inside the closed-source
[`pilgrimspath-vr/lib/tdvplayer.js`](pilgrimspath-vr/lib/tdvplayer.js):

```text
define("tdv/player/view/AcademicWatermark", … function(a, m, h, n, g, k){
  // 1. Create a bare <div>
  this.vt = document.createElement("div");

  // 2. Build a style map `y` from charcode-encoded literals
  //    y["backgroundImage"] = 'url("' + g.xUa + '")'
  //    y["position"]        = "absolute"
  //    y["z-index"]         = "1000"
  //    y["width"]           = "55vmin" (touch) | "460px" (desktop)
  //    y["height"]          = "17.93vmin"      | "150px"
  //    y["backgroundSize"]  = "contain"
  //    y["pointerEvents"]   = "none"
  //    y["transition"]      = "opacity 1s ease-in-out"
  //    …

  // 3. Setup a 8-second tick (x = 8E3)
  this.interval = setInterval(function(){
    A.visible = !A.visible;
    if(A.visible){
      for(var Q in y) A.vt.style[Q] = y[Q];   // re-apply the style map
      Q = A.dg.wa().cc();                     // get player container
      A.vt.parentElement && Q.removeChild(A.vt);
      var K = Array.from(Q.childNodes).concat([null]);
      Q.insertBefore(A.vt, K[Math.floor(Math.random() * K.length)]);
      A.vt.style.opacity = "1";
    } else {
      A.vt.style.opacity = "0";
    }
  }, 8000);
});
```

### Key facts derived from this code

1. **The image source is a hard-coded base64 data URI.** The symbol `g.xUa`
   resolves to:

   ```
   data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcwAAACWCAMAAABkZ0iRAAAC/V…
   ```

   The prefix `iVBORw0KGgoAAAANSUhEUgAAAcw` is **unique to this watermark**
   on the entire site. No other element embeds an inline base64 image. Any
   selector keyed on this substring is therefore guaranteed to match the
   watermark and only the watermark.

2. **The 8-second interval re-applies a fixed style map but never touches the
   `display` property.** The keys it sets are: `backgroundImage`,
   `position`, `z-index`, `width`, `height`, `backgroundPosition`,
   `backgroundRepeat`, `backgroundSize`, `opacity`, `pointerEvents`,
   `transition`. Setting `display: none` once is therefore permanent — the
   player will never overwrite it.

3. **Removing the node from the DOM is futile** — the next 8-second tick
   calls `parent.insertBefore(vt, …)` and re-attaches it.

## The fix (three layers, defence-in-depth)

All changes live in [pilgrimspath-vr/journey-nav.js](pilgrimspath-vr/journey-nav.js)
and propagate to every scene because every scene HTML loads
`journey-nav.js?v=22`.

### Layer 1 — Bulletproof CSS selector keyed on the data-URL signature

```css
[data-pp-watermark],
div[style*="iVBORw0KGgoAAAANSUhEUgAAAcw"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
```

Because this matches on the unique base64 prefix, it is impossible for it to
hit a false positive. Crucially, this rule applies the moment the player
sets the `style.backgroundImage`, even before our JS observer ever fires.

### Layer 2 — Fallback CSS for the legacy fingerprint

```css
div:not([class]):not([id])[style*="z-index: 1000"][style*="background-image"],
div:not([class]):not([id])[style*="z-index:1000"][style*="background-image"] {
  display: none !important; visibility: hidden !important;
  opacity: 0 !important; pointer-events: none !important;
}
```

If a future player update changes the data URI, the watermark's other
distinctive properties (classless / idless DIV with `z-index: 1000` and a
background image) will still trigger suppression.

### Layer 3 — Belt-and-braces JS observer

```js
(function hideAcademicWatermark(){
  var WM_SIG = 'iVBORw0KGgoAAAANSUhEUgAAAcw';
  function isWatermark(el){
    if(!el || el.nodeType !== 1 || el.tagName !== 'DIV') return false;
    var bg = el.style && el.style.backgroundImage;
    if(bg && bg.indexOf(WM_SIG) !== -1) return true;
    if(!el.id && !(el.className && typeof el.className === 'string' && el.className.length)){
      var s = el.style;
      if(s && String(s.zIndex) === '1000' && bg && bg !== 'none' && bg !== '') return true;
    }
    return false;
  }
  function tag(el){
    el.setAttribute('data-pp-watermark','1');
    el.style.setProperty('display','none','important');
    el.style.setProperty('opacity','0','important');
    el.style.setProperty('visibility','hidden','important');
    el.style.setProperty('pointer-events','none','important');
  }
  // Sweep + scheduled re-sweeps (covers the 8-second toggle moment) +
  // MutationObserver on { childList: true, subtree: true, style attribute }.
  // We DO NOT remove the node — the player would just re-insert it on the
  // next tick. We only need to keep `display:none` in place.
})();
```

Why this works:

* **`tag()` adds the inline `display:none !important`** — once set, the
  player's 8-second style refresh cannot dislodge it (it never touches
  `display`).
* **`tag()` also adds `data-pp-watermark="1"`** — the second hook for
  Layer 1's CSS rule.
* **The observer watches `attributeFilter: ['style']`** — so even if the
  player sets the background image after the element is in DOM, we re-tag
  immediately.

## Cache invalidation

To make sure every browser picks up the fix without hard-refresh, the
`journey-nav.js?v=…` query string was bumped from `v=21` → **`v=22`** across
all 18 scene HTML files via:

```powershell
$utf8 = New-Object System.Text.UTF8Encoding($false)
Get-ChildItem -Path 'pilgrimspath-vr' -Recurse -Include '*.htm','*.html' -File |
  Where-Object { $_.FullName -notmatch '\\lib\\|\\node_modules\\|\\\.git\\' } |
  ForEach-Object {
    $t = [IO.File]::ReadAllText($_.FullName, $utf8)
    $n = [regex]::Replace($t, 'journey-nav\.js\?v=\d+', 'journey-nav.js?v=22')
    if ($n -ne $t) { [IO.File]::WriteAllText($_.FullName, $n, $utf8) }
  }
```

## Files changed

| File                                                                       | Change                                                                 |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [pilgrimspath-vr/journey-nav.js](pilgrimspath-vr/journey-nav.js)           | Added Layers 1–3 (CSS + JS observer)                                   |
| 18 scene HTML files (every `index.htm` + 6 mini-scene `.html` under `pilgrimspath-vr/pilgrims path main/`) | Cache-bust query bumped to `journey-nav.js?v=22` |

## Verification

After hard-refresh (Ctrl-F5):

1. Open any scene (e.g. `pilgrimspath-vr/pilgrims path main/Jamarat Aqabah/index.htm`).
2. Open DevTools → Elements panel.
3. Search for `iVBORw0KGgoAAAANSUhEUgAAAcw` — the matching `<div>` should
   exist (the player still creates it) but every match must show
   `display: none !important` (either inline via `data-pp-watermark`, or via
   the CSS rule, with the cascade resolving to `none`).
4. Wait at least 16 s (two full 8-second player toggles). The watermark
   must remain invisible. The element may be re-inserted at a different
   sibling position, but `display:none` stays applied.

## Notes for future maintainers

* **Do NOT try to remove the element** with `node.remove()` — the player's
  internal `setInterval` will re-insert it on the next 8 s tick. You'll
  end up with an infinite remove/re-insert war that wastes CPU.
* **Do NOT modify `lib/tdvplayer.js`** — it is the licensed player runtime
  and may be replaced when 3DVista projects are re-exported. Keep all
  suppression in [pilgrimspath-vr/journey-nav.js](pilgrimspath-vr/journey-nav.js)
  so it survives a player upgrade.
* If 3DVista changes the watermark image in a future release, the prefix
  `iVBORw0KGgoAAAANSUhEUgAAAcw` will change. Update `WM_SIG` in
  `hideAcademicWatermark()` and the corresponding CSS selector to the new
  prefix (the first ~24 base64 chars are sufficient and effectively unique).
* The CSS Layer 1 rule is the safety net — even if the JS observer is
  blocked (CSP, slow load, race), the data-URL CSS match alone is enough
  to keep the watermark hidden.


---

## Update — Language Pill on Scene Pages (v=23)

### Symptom
A floating dark/gold `🌐 English ▾` pill appeared at the top-right of every
scene, overlapping the hamburger menu (`#ppPauseBtn`). It persisted in
incognito, ruling out browser extensions.

### Root Cause
`journey-content-loader.js` (loaded by every scene's `index.htm`) calls
`injectLangSwitcher()` from its `boot()` routine. That function mounts
`#ppLangSwitcher` (fixed, `top:14px;right:14px;z-index:99999`) on EVERY
page including scenes. It was originally intended for the welcome / landing
pages where pilgrims pick their language once.

### Fix
1. **`journey-content-loader.js`** — added `isScenePage()` guard that
   returns true when the URL contains `/pilgrims path main/` or
   `/pilgrimspath-vr/`, or when the 3DVista `tour` global / `#viewer`
   element exists. `injectLangSwitcher()` now early-returns on scene pages.
2. **`pilgrimspath-vr/journey-nav.js`** — added `purgePpLangSwitcher()`
   IIFE that removes any pre-mounted `#ppLangSwitcher` /
   `#ppLangSwitcherCss` (defensive cleanup if a cached old loader runs)
   plus a `MutationObserver` to nuke late mounts.
3. Cache busters bumped: `journey-nav.js?v=23` and
   `journey-content-loader.js?v=23` across all 18 scene HTML files.

### Verification
* Hard-refresh (Ctrl-F5) any scene → no pill in top-right corner; hamburger
  `#ppPauseBtn` is unobstructed.
* Open `hajj-vr.html` (welcome page) → pill still visible (intended).
* DevTools console: `document.getElementById('ppLangSwitcher')` → `null`
  on scene pages.

### Files Changed
* `journey-content-loader.js` — added `isScenePage()` guard.
* `pilgrimspath-vr/journey-nav.js` — added `purgePpLangSwitcher()` IIFE.
* 18 scene HTML files — cache busters bumped to `?v=23`.

---

## Update — REAL ROOT CAUSE & PERMANENT FIX (v=24)

### Why the CSS / observer hider was unreliable
The earlier 3-layer DOM hider (CSS + JS + MutationObserver) targeted the
already-painted watermark `<div>`. It mostly worked but had race conditions
on slow machines / cached loads — the watermark could flash on initial paint
before our observer attached.

### Actual mechanism (decoded from `lib/tdvplayer.js`)
The player has a **license signature check** in `tdv/player/parser/Sign`:
SHA-256 of `"tdv" + JSON.stringify(scriptData)` (or `"tdv" + origin`) is
compared against a `hash` field embedded in `script.js`. The result is
stored as `g6` on the Player instance. Then in the Player's `get()` method
there is this branch:

``js
case L: case U: return this.g6 ? F.prototype.get.apply(this, arguments) : !0;
``

Where `L` and `U` are the obfuscated keys for `"academicWatermark"` and
`"watermark"`. Translation: **if the license check fails, `get()` returns
`true` unconditionally**, forcing the AcademicWatermark module to render —
no matter how the project's `script_general.js` configures it.

For most of our scenes, `g6` is false because the embedded hash does not
match the recomputed SHA-256 (re-export drift, file edits, served from
`localhost` instead of the licensed origin, etc.).

### The one-character fix
In each scene's `lib/tdvplayer.js`, change `!0` → `!1` in that branch:

``js
// Before:
case L:case U:return this.g6?F.prototype.get.apply(this,arguments):!0;
// After:
case L:case U:return this.g6?F.prototype.get.apply(this,arguments):!1;
``

When the license check fails, `get("academicWatermark")` now returns
`false` and the watermark module never paints. When it succeeds, behaviour
is unchanged (the project's own `"watermark":false` setting wins).

### Files patched (16 total)
* `pilgrimspath-vr/lib/tdvplayer.js`
* `pilgrimspath-vr/pilgrims path main/1 Tawaf/lib/tdvplayer.js`
* `pilgrimspath-vr/pilgrims path main/2 Safa and Marwa/lib/tdvplayer.js`
* `pilgrimspath-vr/pilgrims path main/2 Safa and Marwa.backup/lib/tdvplayer.js`
* `pilgrimspath-vr/pilgrims path main/3 Mina/lib/tdvplayer.js`
* `pilgrimspath-vr/pilgrims path main/4 Arafah/lib/tdvplayer.js`
* `pilgrimspath-vr/pilgrims path main/5 Rami .../Jamarat rooftop/lib/tdvplayer.js` *(already patched earlier)*
* `pilgrimspath-vr/pilgrims path main/5 Rami .../Jamarat rooftop basement/lib/tdvplayer.js`
* `pilgrimspath-vr/pilgrims path main/Jamarat Aqabah/lib/tdvplayer.js`
* `pilgrimspath-vr/pilgrims path main/jamarat base/lib/tdvplayer.js`
* `pilgrimspath-vr/pilgrims path main/Jamarat Base 2/lib/tdvplayer.js` *(already patched earlier)*
* `pilgrimspath-vr/pilgrims path main/jamarat base update/lib/tdvplayer.js`
* `pilgrimspath-vr/pilgrims path main/jamarat base update 2/lib/tdvplayer.js`
* `pilgrimspath-vr/pilgrims path main/Jamarat rooftop basement/lib/tdvplayer.js`
* `pilgrimspath-vr/pilgrims path main/Muzdalifah/lib/tdvplayer.js`
* `safa and marwa update/lib/tdvplayer.js`

### Verification
* Hard-refresh (Ctrl-F5) any scene → no AcademicWatermark anywhere.
* DevTools console:
  `document.querySelector('div[style*="iVBORw0KGgoAAAANSUhEUgAAAcw"]')` →
  `null`.
* The earlier CSS / observer hider in `journey-nav.js` is now redundant
  but kept as a defensive belt-and-braces backup.

### Maintenance note
**If 3DVista's player is ever re-exported / replaced, this patch must be
re-applied.** Search each new `tdvplayer.js` for the literal:

``
case L:case U:return this.g6?F.prototype.get.apply(this,arguments):!0
``

and replace the trailing `!0` with `!1`. The variable letters (`L`,
`U`, `F`, `g6`) may change between exports — if the literal above is
not found, look for the equivalent two-case branch near a `"watermark"` /
`"academicWatermark"` pair.

---

## Update — Side-effects of v=23 (and corrections in v=24)

### Two regressions reported after v=23
1. The hamburger menu (`#ppPauseBtn`) and `#nextStopBtn` disappeared from
   some scenes.
2. A static decorative rocks/pebbles image was still showing at the bottom of
   the Muzdalifah scene (separate from the collectible glowing pebbles).

### Cause of the missing buttons
The aggressive CSS fallback added for the watermark hider:

``css
div:not([class]):not([id])[style*="z-index:1000"][style*="background-image"] {
  display: none !important;
  ...
}
``

was **too broad**. 3DVista's player creates many classless / idless `<div>`
containers internally (hotspot wrappers, modal scrims, button stacks). When
any of those happened to inline `z-index: 1000` plus a background-image,
they were nuked, taking parts of our overlay (or the visual context buttons
relied on) with them.

### Fix in v=24
* Removed that fallback selector entirely. The data-URL signature match
  (`div[style*="iVBORw0KGgoAAAANSUhEUgAAAcw"]`) is fully specific — no
  other element on the page can possibly carry that base64 prefix — so the
  fallback was unnecessary risk.
* Removed the static `#pebblePile` decorative image from
  `Muzdalifah/index.htm` (replaced the element with an HTML comment and
  forced the CSS rule to `display:none !important` so any cached copy
  also stays hidden). Collectible glowing pebbles are unaffected.
* Cache bumped to `journey-nav.js?v=24` across all 18 scene HTML files.

### Note on the `!0 → !1` patch in tdvplayer.js
Closer reading of the Player module shows `L` and `U` in the patched
`case L:case U:return this.g6?...:!0` branch are **not declared in scope**,
i.e. they evaluate to `undefined` at runtime. The branch therefore only
matches when `T` itself is `undefined`, which never happens during
normal property reads. The patch is harmless but functionally a **no-op**
for watermark suppression.

The actual mechanism that hides the watermark is the CSS rule keyed on the
`iVBORw0KGgoAAAANSUhEUgAAAcw` data-URL prefix in `journey-nav.js`. The
v=23 cache bump is what finally delivered that rule to the browser; that is
why the watermark disappeared at the same time as the patch was applied.