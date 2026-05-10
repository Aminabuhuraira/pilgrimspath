// ═══ JOURNEY NAVIGATION UI INJECTOR ═══
// Injects progress indicators and navigation buttons into VR scenes
// Requires journey-manager.js to be loaded first

(function(){

// ── Ensure journey-manager is loaded ──
if(typeof jm === 'undefined'){
  console.error('[JourneyNav] journey-manager.js not loaded');
  return;
}

// Overlay root — #viewer is what 3DVista calls requestFullscreen() on, so
// elements appended here stay visible in both normal and fullscreen modes.
var _overlayRoot = document.getElementById('viewer') || document.body;

// ── CSS for navigation UI ──
const journeyNavCSS = `
/* Journey Navigation Container */
#journeyNav {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 5000;
  font-family: 'DM Sans', Arial, sans-serif;
  display: none; /* legacy dots container disabled */
}

/* ═══ Pause button + user menu ═══ */
#ppPauseBtn {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 99502;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1.5px solid #C9A84C;
  background: linear-gradient(145deg, #FAF5EB, #F0E4C7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.28);
  transition: transform .12s, box-shadow .12s, border-color .12s, background .12s;
}
#ppPauseBtn:hover {
  transform: scale(1.06);
  border-color: #8B6914;
  background: linear-gradient(145deg, #FFFBF0, #F7EBCE);
  box-shadow: 0 6px 22px rgba(201,168,76,0.55);
}
.ppPauseIcon {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
.ppPauseIcon span {
  display: block;
  width: 5px;
  height: 16px;
  border-radius: 2px;
  background: #8B6914;
}
body.ppMenuOpen #ppPauseBtn .ppPauseIcon { gap: 0; position: relative; width: 18px; height: 18px; }
body.ppMenuOpen #ppPauseBtn .ppPauseIcon span {
  position: absolute; top: 50%; left: 50%; width: 20px; height: 2px;
  background: #8B6914; border-radius: 2px;
}
body.ppMenuOpen #ppPauseBtn .ppPauseIcon span:nth-child(1){ transform: translate(-50%,-50%) rotate(45deg); }
body.ppMenuOpen #ppPauseBtn .ppPauseIcon span:nth-child(2){ transform: translate(-50%,-50%) rotate(-45deg); }
/* Fullscreen-safe duplicates (class may be on the fullscreen element instead of body) */
.ppMenuOpen #ppPauseBtn .ppPauseIcon { gap: 0; position: relative; width: 18px; height: 18px; }
.ppMenuOpen #ppPauseBtn .ppPauseIcon span {
  position: absolute; top: 50%; left: 50%; width: 20px; height: 2px;
  background: #8B6914; border-radius: 2px;
}
.ppMenuOpen #ppPauseBtn .ppPauseIcon span:nth-child(1){ transform: translate(-50%,-50%) rotate(45deg); }
.ppMenuOpen #ppPauseBtn .ppPauseIcon span:nth-child(2){ transform: translate(-50%,-50%) rotate(-45deg); }

#ppMenuBackdrop {
  position: fixed;
  inset: 0;
  z-index: 99500;
  background: rgba(8,5,2,0.55);
  backdrop-filter: blur(2px);
  opacity: 0;
  pointer-events: none;
  transition: opacity .18s;
}
body.ppMenuOpen #ppMenuBackdrop { opacity: 1; pointer-events: auto; }
.ppMenuOpen #ppMenuBackdrop { opacity: 1; pointer-events: auto; }

#ppMenuPanel {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  z-index: 99501;
  width: min(340px, 88vw);
  background: linear-gradient(180deg, #FFFDF7 0%, #F4EBD2 100%);
  border-left: 1.5px solid #C9A84C;
  box-shadow: -8px 0 32px rgba(0,0,0,0.25);
  color: #3D2B1F;
  font-family: 'DM Sans', Arial, sans-serif;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform .22s ease-out;
  overflow-y: auto;
}
body.ppMenuOpen #ppMenuPanel { transform: translateX(0); }
.ppMenuOpen #ppMenuPanel { transform: translateX(0); }

.ppMenuHead {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(139,105,20,0.22);
}
.ppMenuAvatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #C9A84C, #8B6914);
  color: #FFFDF7;
  font-weight: 800;
  font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  flex: 0 0 auto;
  box-shadow: 0 2px 8px rgba(201,168,76,0.4);
}
.ppMenuWho { flex: 1 1 auto; min-width: 0; }
.ppMenuName {
  font-size: 15px; font-weight: 700; color: #3D2B1F;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ppMenuMail {
  font-size: 11.5px; color: #8B6914; margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ppMenuClose {
  background: transparent; border: none; color: #8B6914;
  font-size: 26px; line-height: 1; cursor: pointer;
  padding: 4px 8px; border-radius: 6px;
  transition: background .12s, color .12s;
}
.ppMenuClose:hover { background: rgba(201,168,76,0.18); color: #5C4408; }

.ppMenuProgress { padding: 14px 18px 16px; border-bottom: 1px solid rgba(139,105,20,0.16); }
.ppMenuProgLbl {
  display: flex; justify-content: space-between;
  font-size: 11px; color: #8B6914;
  letter-spacing: 0.4px; text-transform: uppercase;
  margin-bottom: 6px; font-weight: 700;
}
.ppMenuProgBar {
  height: 6px; border-radius: 3px;
  background: rgba(201,168,76,0.2); overflow: hidden;
}
.ppMenuProgFill {
  height: 100%;
  background: linear-gradient(90deg, #C9A84C, #8B6914);
  border-radius: 3px;
  transition: width .3s;
}

.ppMenuList { padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; }
.ppMenuList button {
  appearance: none;
  background: transparent;
  border: none;
  color: #3D2B1F;
  text-align: left;
  font-family: inherit;
  font-size: 14px;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background .12s, color .12s;
}
.ppMenuList button:hover { background: rgba(201,168,76,0.18); color: #5C4408; }
.ppMenuList button:active { background: rgba(201,168,76,0.28); }
.ppMenuMeta {
  margin-left: auto;
  font-size: 11px; font-weight: 700;
  color: #5C4408;
  background: rgba(201,168,76,0.22);
  padding: 2px 8px; border-radius: 10px;
}

.ppMenuFoot {
  margin-top: auto;
  padding: 14px 18px 18px;
  font-size: 11px;
  color: #8B6914;
  text-align: center;
  border-top: 1px solid rgba(139,105,20,0.16);
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* Hide legacy dots if any older copy lingers */
.journey-dots { display: none !important; }

/* Hide 3DVista built-in language switcher / locale UI in every scene.
   These selectors target the player's IconButton + popup menu used for locale. */
.TDVPlayer-LanguageButton,
[class*="LanguageMenu"],
[class*="LanguageButton"],
.TDVPlayer-Menu[data-locale],
.locale-switcher,
[id*="LanguageSelect"],
[id*="languageSelect"] { display: none !important; visibility: hidden !important; }

/* ─────────────────────────────────────────────────────────────────────────
   Hide 3DVista academic / "Created by 3DVista Academic" watermark.

   The watermark is rendered by the AcademicWatermark module inside
   lib/tdvplayer.js. Reading the module reveals two facts we exploit here:

     (1) The watermark image is hard-coded as a base64 data: URI assigned to
         the 'g.xUa' symbol. It begins with the unique signature
            iVBORw0KGgoAAAANSUhEUgAAAcwAAACWCAMAAABkZ0iRAAAC/V
         which CANNOT appear in any other element on the page (no other asset
         is embedded as base64 inline). Matching on this substring inside the
         element's 'style' attribute is therefore 100% reliable and will
         never hit a false positive.

     (2) The element's lifecycle is:
            createElement('div') → set styles → append → setInterval(8s) that
            toggles 'opacity: 0/1' and re-inserts the node at a random
            position among its parent's children.
         Crucially, the interval ONLY re-applies the keys defined in the
         'y' lookup map: backgroundImage, position, z-index, width, height,
         backgroundPosition, backgroundRepeat, backgroundSize, opacity,
         pointerEvents, transition. It does NOT touch 'display', so once we
         hide via 'display:none !important' it stays hidden forever. Removing
         the element via .remove() does NOT work — the player just re-inserts
         it on the next 8-second tick.

   We use CSS-only suppression keyed on the data-URL signature for maximum
   robustness. No JS observer / interval is needed for this. The legacy
   z-index/background-image fallback below is kept for safety. */
[data-pp-watermark],
div[style*="iVBORw0KGgoAAAANSUhEUgAAAcw"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
/* NOTE: A previous, broader fallback (div:not([class]):not([id])[style*="z-index:1000"][style*="background-image"])
   was removed because it could match legitimate 3DVista player containers,
   including ones that visually parent our hamburger / Next Stop buttons.
   The data-URL signature match above is fully specific and sufficient. */

/* ═══ Hide 3DVista panorama-name tooltips ═══
   The TDV player renders hotspot/panorama tooltips as a <span> with
   pointer-events:none; position:absolute; text-align:center injected inline.
   No other element in our codebase has all three simultaneously. ═══ */
span[style*="pointer-events: none"][style*="position: absolute"][style*="text-align: center"],
span[style*="pointer-events:none"][style*="position:absolute"][style*="text-align:center"] {
  display: none !important;
}

/* ═══ When paused: lift the entire #viewer stacking context above body-level
   banners (e.g. #sceneBanner z=10003), so the pause panel and the bottom
   scene-strip render IN FRONT of any open banner. The base #viewer { z-index:1 }
   set in scene CSS would otherwise trap the panel below body-level overlays. ═══ */
body.ppMenuOpen #viewer { z-index: 99490 !important; }
.ppMenuOpen #viewer { z-index: 99490 !important; }

/* Next Stop Button */
#nextStopBtn {
  display: none;
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 5001;
  background: linear-gradient(135deg, #C9A84C, #8B6914);
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 700;
  font-family: 'DM Sans', Arial, sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(201, 168, 76, 0.5);
  transition: all 0.15s;
  white-space: nowrap;
}

#nextStopBtn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 32px rgba(201, 168, 76, 0.7);
}

#nextStopBtn:active {
  transform: scale(0.97);
}

/* Locked variant — activity not yet complete */
#nextStopBtn.locked {
  background: linear-gradient(135deg, #6B5B4F, #3D2B1F);
  box-shadow: 0 4px 14px rgba(0,0,0,0.35);
  opacity: 0.92;
}
#nextStopBtn.locked::before {
  content: '\\01F512  ';
}

/* Path-Cue Onboarding Toast */
#pathCueToast {
  position: fixed;
  bottom: 110px;
  left: 50%;
  transform: translateX(-50%) translateY(12px);
  z-index: 4900;
  background: linear-gradient(135deg, rgba(255,253,247,0.96), rgba(244,235,210,0.96));
  color: #3D2B1F;
  border: 1px solid rgba(139,105,20,0.32);
  border-radius: 999px;
  padding: 9px 18px;
  font-family: 'DM Sans', Arial, sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
  box-shadow: 0 6px 22px rgba(61,43,31,0.18);
  pointer-events: none;
  opacity: 0;
  transition: opacity .45s ease, transform .45s ease;
  max-width: min(92vw, 540px);
  text-align: center;
  line-height: 1.35;
}
#pathCueToast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
@media (max-width: 520px){
  #pathCueToast { font-size: 12px; padding: 8px 14px; bottom: 84px; }
}

/* Activity-required notice (shown when user taps Next before finishing) */
#activityNotice {
  position: fixed;
  bottom: 76px;
  right: 20px;
  z-index: 5002;
  background: rgba(61,43,31,0.94);
  color: #FFFDF7;
  border: 1px solid rgba(201,168,76,0.5);
  border-radius: 12px;
  padding: 10px 14px;
  font-family: 'DM Sans', Arial, sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  max-width: 260px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity .25s, transform .25s;
  pointer-events: none;
}
#activityNotice.visible { opacity: 1; transform: translateY(0); }

/* ═══ Quiz overlay ═══ */
#ppQuizOverlay {
  position: fixed; inset: 0; z-index: 10050;
  background: rgba(20,12,4,0.72);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', Arial, sans-serif;
  animation: ppQuizFade .25s ease;
}
@keyframes ppQuizFade { from{opacity:0} to{opacity:1} }
#ppQuizOverlay .ppQuizCard {
  width: min(94vw, 540px); max-height: 86vh; overflow: hidden;
  background: linear-gradient(145deg, #FFFDF7, #F4EBD2);
  border: 2px solid #C9A84C; border-radius: 22px;
  box-shadow: 0 24px 70px rgba(0,0,0,0.55);
  display: flex; flex-direction: column;
  color: #3D2B1F;
}
#ppQuizOverlay header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid rgba(139,105,20,0.18);
}
#ppQuizOverlay .ppQuizBadge {
  font-size: 12px; font-weight: 700; letter-spacing: .6px;
  color: #8B6914; text-transform: uppercase;
}
#ppQuizOverlay .ppQuizSkip {
  background: transparent; border: none; color: #8B6914;
  font-size: 13px; font-weight: 600; cursor: pointer; padding: 4px 8px;
  border-radius: 6px;
}
#ppQuizOverlay .ppQuizSkip:hover { background: rgba(139,105,20,0.08); }
#ppQuizOverlay .ppQuizBody {
  padding: 22px 22px 16px; overflow-y: auto; flex: 1;
}
#ppQuizOverlay .ppQuizBody h3 {
  margin: 0 0 16px; font-size: 17px; font-weight: 700; line-height: 1.4; color: #2C1810;
}
#ppQuizOverlay .ppQuizOpts {
  display: flex; flex-direction: column; gap: 9px;
}
#ppQuizOverlay .ppQuizOpt {
  text-align: left; padding: 12px 16px; border-radius: 12px;
  border: 1.5px solid rgba(139,105,20,0.28);
  background: rgba(255,253,247,0.7); color: #3D2B1F;
  font-size: 14px; font-weight: 500; cursor: pointer;
  transition: all .15s; font-family: inherit;
}
#ppQuizOverlay .ppQuizOpt:hover:not(:disabled) {
  border-color: #C9A84C; background: rgba(244,235,210,0.9);
}
#ppQuizOverlay .ppQuizOpt.correct {
  border-color: #22c55e; background: rgba(34,197,94,0.14); color: #14532D;
}
#ppQuizOverlay .ppQuizOpt.wrong {
  border-color: #dc2626; background: rgba(220,38,38,0.12); color: #7F1D1D;
}
#ppQuizOverlay .ppQuizOpt:disabled { cursor: default; }
#ppQuizOverlay .ppQuizExplain {
  margin-top: 14px; padding: 10px 14px; border-radius: 10px;
  background: rgba(201,168,76,0.12); border-left: 3px solid #C9A84C;
  color: #3D2B1F; font-size: 13px; line-height: 1.5; opacity: 0;
  transition: opacity .25s;
}
#ppQuizOverlay .ppQuizExplain.visible { opacity: 1; }
#ppQuizOverlay footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; border-top: 1px solid rgba(139,105,20,0.18);
  background: rgba(255,253,247,0.6);
}
#ppQuizOverlay .ppQuizDots { display: flex; gap: 6px; }
#ppQuizOverlay .ppQuizDot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(139,105,20,0.25);
}
#ppQuizOverlay .ppQuizDot.on { background: #C9A84C; }
#ppQuizOverlay .ppQuizDot.done { background: #8B6914; }
#ppQuizOverlay .ppQuizPrimary {
  background: linear-gradient(135deg, #C9A84C, #8B6914); color: #fff;
  border: none; border-radius: 999px; padding: 9px 22px; font-size: 13px;
  font-weight: 700; cursor: pointer; transition: transform .12s, opacity .15s;
  font-family: inherit;
}
#ppQuizOverlay .ppQuizPrimary:hover:not(.disabled):not(:disabled) { transform: scale(1.04); }
#ppQuizOverlay .ppQuizPrimary.disabled, #ppQuizOverlay .ppQuizPrimary:disabled {
  opacity: 0.5; cursor: not-allowed;
}
#ppQuizOverlay .ppQuizSummary { text-align: center; padding: 18px 4px; }
#ppQuizOverlay .ppQuizScore {
  font-size: 38px; font-weight: 800; color: #8B6914; margin-bottom: 8px;
}
#ppQuizOverlay .ppQuizSummary p { margin: 0; font-size: 14px; color: #3D2B1F; }
@media (max-width: 520px){
  #ppQuizOverlay .ppQuizCard { width: 96vw; }
  #ppQuizOverlay .ppQuizBody h3 { font-size: 15px; }
  #ppQuizOverlay .ppQuizOpt { font-size: 13px; padding: 10px 14px; }
}

/* Journey Complete Banner */
#journeyComplete {
  display: none;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 6000;
  background: repeating-linear-gradient(45deg, transparent, transparent 14px, rgba(201, 168, 76, 0.045) 14px, rgba(201, 168, 76, 0.045) 15px),
              repeating-linear-gradient(-45deg, transparent, transparent 14px, rgba(201, 168, 76, 0.045) 14px, rgba(201, 168, 76, 0.045) 15px),
              #FAF5EB;
  border: 3px solid #C9A84C;
  border-radius: 24px;
  padding: 44px 48px;
  max-width: 600px;
  width: 92vw;
  text-align: center;
  font-family: 'DM Sans', Arial, sans-serif;
  color: #2C1810;
  box-shadow: 0 0 0 4px #E8E0D4, 0 0 0 8px rgba(201, 168, 76, 0.35), 0 24px 64px rgba(0, 0, 0, 0.3);
}

#journeyComplete h2 {
  color: #8B6914;
  font-size: 28px;
  margin: 0 0 16px;
  font-weight: 700;
}

#journeyComplete p {
  color: #3D2B1F;
  font-size: 16px;
  line-height: 1.8;
  margin: 0 0 24px;
}

#journeyComplete .subtext {
  color: #6B5B4F;
  font-size: 14px;
  font-style: italic;
  margin: 0 0 28px;
}

#journeyComplete button {
  background: linear-gradient(135deg, #C9A84C, #8B6914);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'DM Sans', Arial, sans-serif;
  cursor: pointer;
  margin-top: 14px;
  box-shadow: 0 4px 16px rgba(201, 168, 76, 0.3);
  transition: transform 0.15s;
}

#journeyComplete button:active {
  transform: scale(0.96);
}

@media (max-width: 768px) {
  #journeyNav {
    bottom: 15px;
    right: 15px;
  }

  #ppPauseBtn { width: 40px; height: 40px; top: 10px; right: 10px; }
  .ppPauseIcon span { height: 14px; width: 4px; }

  #nextStopBtn {
    bottom: 15px;
    right: 15px;
    padding: 12px 20px;
    font-size: 14px;
  }

  #journeyComplete {
    padding: 28px 22px;
    border-radius: 18px;
  }

  #journeyComplete h2 {
    font-size: 22px;
  }

  #journeyComplete p {
    font-size: 14px;
  }
}

@media (max-width: 640px) {
  #ppPauseBtn {
    top: max(10px, env(safe-area-inset-top));
    right: max(10px, env(safe-area-inset-right));
  }

  body.ppOverlayActive #ppPauseBtn,
  body.ppOverlayActive #nextStopBtn,
  body.ppOverlayActive #activityNotice,
  body.ppOverlayActive #pathCueToast,
  body.ppOverlayActive #jamarHUD,
  body.ppOverlayActive #jamarThrowBtn,
  body.ppOverlayActive #jamarAimHint,
  body.ppOverlayActive #minaContinue,
  body.ppOverlayActive #umrahTrimContinue,
  body.ppOverlayActive #barberContinue,
  body.ppOverlayActive #muzdHud,
  body.ppOverlayActive #muzdPouch,
  body.ppOverlayActive #tawafCounter,
  body.ppOverlayActive #saiCounter,
  .ppOverlayActive #ppPauseBtn,
  .ppOverlayActive #nextStopBtn,
  .ppOverlayActive #activityNotice,
  .ppOverlayActive #pathCueToast,
  .ppOverlayActive #jamarHUD,
  .ppOverlayActive #jamarThrowBtn,
  .ppOverlayActive #jamarAimHint,
  .ppOverlayActive #minaContinue,
  .ppOverlayActive #umrahTrimContinue,
  .ppOverlayActive #barberContinue,
  .ppOverlayActive #muzdHud,
  .ppOverlayActive #muzdPouch,
  .ppOverlayActive #tawafCounter,
  .ppOverlayActive #saiCounter {
    display: none !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  #nextStopBtn {
    right: max(10px, env(safe-area-inset-right));
    bottom: max(12px, env(safe-area-inset-bottom));
    max-width: calc(100vw - 20px);
    padding: 10px 16px;
    font-size: 13px;
  }

  #activityNotice {
    right: max(10px, env(safe-area-inset-right));
    bottom: calc(56px + env(safe-area-inset-bottom));
    max-width: min(72vw, 250px);
    font-size: 12px;
  }

  #ppQuizOverlay {
    padding: 12px;
    box-sizing: border-box;
  }

  #ppQuizOverlay .ppQuizCard {
    width: min(100%, 460px);
    max-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px);
    border-radius: 18px;
  }

  #ppQuizOverlay .ppQuizBody {
    padding: 16px 16px 12px;
  }

  #ppQuizOverlay footer,
  #ppQuizOverlay header {
    padding-left: 14px;
    padding-right: 14px;
  }

  #sceneBanner,
  #jamarGuide,
  #jamarComplete,
  #journeyComplete {
    width: min(92vw, 420px) !important;
    max-width: calc(100vw - 18px) !important;
    max-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px) !important;
    overflow-y: auto !important;
    box-sizing: border-box;
  }

  /* Replace the banner-frame.png background with a clean CSS card on mobile —
     the wide decorative image distorts badly on narrow screens. */
  #sceneBanner {
    background: linear-gradient(135deg, #FDFAF0 0%, #F5EDD4 100%) !important;
    border: 2.5px solid #C9A84C !important;
    border-radius: 16px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(201,168,76,0.25) !important;
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    min-height: 0 !important;
  }

  #sceneBanner .sceneBannerBody {
    padding: 24px 20px 18px !important;
  }

  #jamarGuide,
  #jamarComplete,
  #journeyComplete {
    padding: 20px 18px !important;
    border-radius: 16px !important;
  }

  #jamarGuide h3,
  #jamarComplete h3,
  #journeyComplete h2 {
    font-size: clamp(18px, 5vw, 22px) !important;
  }

  #jamarGuide .steps li,
  #jamarComplete p,
  #journeyComplete p {
    font-size: 13px !important;
    line-height: 1.45 !important;
  }

  #jamarThrowBtn,
  #minaContinue,
  #umrahTrimContinue,
  #barberContinue {
    bottom: max(12px, env(safe-area-inset-bottom)) !important;
    max-width: calc(100vw - 20px) !important;
    width: min(92vw, 360px);
    padding: 12px 18px !important;
    font-size: 14px !important;
    gap: 8px !important;
    box-sizing: border-box;
    justify-content: center;
  }

  #jamarAimHint {
    bottom: calc(66px + env(safe-area-inset-bottom)) !important;
    max-width: calc(100vw - 24px);
    font-size: 12px !important;
    padding: 6px 12px !important;
    box-sizing: border-box;
  }

  #pathCueToast {
    max-width: calc(100vw - 92px);
  }

  #jamarHUD,
  #muzdHud,
  #muzdPouch,
  #tawafCounter,
  #saiCounter {
    max-width: calc(100vw - 86px) !important;
    box-sizing: border-box;
  }

  #jamarHUD {
    top: calc(env(safe-area-inset-top) + 56px) !important;
    right: max(8px, env(safe-area-inset-right)) !important;
    min-width: 0 !important;
    width: min(220px, calc(100vw - 86px)) !important;
    padding: 10px 12px !important;
  }
}

@media (max-width: 640px) and (max-height: 520px) {
  #sceneBanner,
  #jamarGuide,
  #jamarComplete,
  #journeyComplete,
  #ppQuizOverlay .ppQuizCard {
    max-height: calc(100vh - 18px) !important;
  }

  #jamarThrowBtn,
  #nextStopBtn,
  #minaContinue,
  #umrahTrimContinue,
  #barberContinue {
    padding: 10px 14px !important;
    font-size: 12.5px !important;
  }

  #nextStopBtn {
    bottom: calc(62px + env(safe-area-inset-bottom)) !important;
  }

  #activityNotice {
    bottom: calc(108px + env(safe-area-inset-bottom)) !important;
  }

  #jamarAimHint {
    bottom: calc(112px + env(safe-area-inset-bottom)) !important;
  }
}
`;

// ── Initialize UI on DOM Ready ──
function initJourneyNav() {
  // Right-side progress dots have been removed per UX request — the bottom
  // step icon strip (scene-nav-overlay.js) now serves as the sole progress UI.
  // Inject the pause / user-menu instead.
  initOverlayStateBridge();
  initPauseMenu();
}

function initOverlayStateBridge(){
  if(window.__ppOverlayBridgeReady) return;
  window.__ppOverlayBridgeReady = true;

  var overlayIds = ['sceneBanner', 'jamarGuide', 'jamarComplete', 'journeyComplete', 'ppQuizOverlay'];
  var classTargets = [];

  function collectTargets(){
    classTargets = [document.body, document.documentElement, _overlayRoot];
    var fs = document.fullscreenElement || document.webkitFullscreenElement;
    if(fs) classTargets.push(fs);
  }

  function isVisible(el){
    if(!el) return false;
    var style = window.getComputedStyle(el);
    if(style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function syncOverlayState(){
    collectTargets();
    var active = overlayIds.some(function(id){ return isVisible(document.getElementById(id)); });
    classTargets.forEach(function(node){
      if(!node || !node.classList) return;
      node.classList.toggle('ppOverlayActive', active);
    });
  }

  window.__ppSyncOverlayState = syncOverlayState;
  syncOverlayState();

  try{
    var observer = new MutationObserver(syncOverlayState);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'open']
    });
  }catch(_){ }

  document.addEventListener('fullscreenchange', syncOverlayState);
  document.addEventListener('webkitfullscreenchange', syncOverlayState);
  window.addEventListener('resize', syncOverlayState);
  setTimeout(syncOverlayState, 250);
  setTimeout(syncOverlayState, 1000);
}

// ═══ QUIZ — Optional post-scene reflection ═══
// Triggered when the user clicks "Next Stop" if they opted in on hajj-vr.html.
// Questions are loaded from /pilgrimspath-vr/quiz-content.js (PPQuiz.questions[step]).
function quizEnabled(){
  try{
    var v = localStorage.getItem('pp_quiz_enabled');
    return v === null ? true : v === '1'; // default ON for new users
  }catch(e){ return true; }
}
// Aggregate quiz performance across all answered steps.
// Returns {answered, totalQuestions, correct, percent} where percent is 0-100.
function quizAggregateScore(){
  var out = { answered: 0, totalQuestions: 0, correct: 0, percent: 0 };
  try{
    var all = JSON.parse(localStorage.getItem('pp_quiz_scores') || '{}');
    Object.keys(all).forEach(function(k){
      var s = all[k]; if(!s) return;
      out.answered++;
      out.totalQuestions += (s.total || 0);
      out.correct       += (s.score || 0);
    });
    if(out.totalQuestions > 0){
      out.percent = Math.round((out.correct / out.totalQuestions) * 100);
    }
  }catch(e){}
  return out;
}
// Total number of quiz questions defined across all 16 steps (used for "covered" %).
function quizTotalAvailable(){
  try{
    if(!window.PPQuiz || !window.PPQuiz.questions) return 0;
    var t = 0;
    Object.keys(window.PPQuiz.questions).forEach(function(k){
      var qs = window.PPQuiz.questions[k]; if(qs && qs.length) t += qs.length;
    });
    return t;
  }catch(e){ return 0; }
}
function certificateEarned(){
  var s = quizAggregateScore();
  // Earn the cert once the user has answered at least 80% of all available
  // questions AND scored 80% on what they answered.
  var avail = quizTotalAvailable();
  var coverage = avail ? (s.totalQuestions / avail) : 0;
  return s.percent >= 80 && coverage >= 0.8;
}
try{ window.quizAggregateScore = quizAggregateScore; window.certificateEarned = certificateEarned; }catch(e){}
function loadQuizContent(cb){
  if(window.PPQuiz && window.PPQuiz.questions){ cb(); return; }
  var s = document.createElement('script');
  s.src = '/pilgrimspath-vr/quiz-content.js?v=5';
  s.onload = cb;
  s.onerror = function(){ console.warn('[Quiz] failed to load content'); cb(); };
  document.head.appendChild(s);
}
function _resolveCurrentQuizStep(){
  // PRIORITY 1: explicit ?journey=N URL param (most reliable per-page indicator)
  try{
    var p = new URLSearchParams(window.location.search);
    var j = parseInt(p.get('journey') || '0', 10);
    if(j >= 1 && j <= 16) return j;
  }catch(e){}
  // PRIORITY 2: jm.currentStep (may be stale if scene was opened without ?journey=)
  if(window.jm && jm.currentStep) return jm.currentStep;
  return 0;
}
function showQuizForCurrentStep(onDone){
  var step = _resolveCurrentQuizStep();
  var pool = (window.PPQuiz && window.PPQuiz.questions && window.PPQuiz.questions[step]) || null;
  if(!pool || !pool.length){
    console.warn('[Quiz] no pool for resolved step='+step+' \u2014 skipping quiz');
    onDone(); return;
  }
  // --- Shuffle pool (Fisher-Yates) and pick N for this session ---
  var perSession = (window.PPQuiz && window.PPQuiz.questionsPerSession) || 5;
  function _shuffle(arr){
    var a = arr.slice();
    for(var i=a.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  var sessionQs = _shuffle(pool).slice(0, Math.min(perSession, pool.length));
  // Also shuffle each question's answer choices and remap correct index.
  var qs = sessionQs.map(function(orig){
    var pairs = orig.a.map(function(opt,i){ return { opt: opt, isCorrect: (i === orig.correct) }; });
    var shuffledPairs = _shuffle(pairs);
    var newCorrect = 0;
    var newA = shuffledPairs.map(function(p,i){ if(p.isCorrect) newCorrect = i; return p.opt; });
    return { q: orig.q, a: newA, correct: newCorrect, why: orig.why };
  });
  console.log('[Quiz] step '+step+' \u2014 pool='+pool.length+' picked='+qs.length);
  // Build modal
  var ov = document.createElement('div');
  ov.id = 'ppQuizOverlay';
  ov.innerHTML = '<div class="ppQuizCard">'+
    '<header><span class="ppQuizBadge">Reflection \u2022 Step '+step+'</span>'+
    '<button type="button" class="ppQuizSkip" aria-label="Skip">Skip \u203a</button></header>'+
    '<div class="ppQuizBody"></div>'+
    '<footer><div class="ppQuizDots"></div><button type="button" class="ppQuizPrimary">Next \u203a</button></footer>'+
    '</div>';
  _overlayRoot.appendChild(ov);
  var bodyEl = ov.querySelector('.ppQuizBody');
  var dotsEl = ov.querySelector('.ppQuizDots');
  var primary = ov.querySelector('.ppQuizPrimary');
  var skipBtn = ov.querySelector('.ppQuizSkip');
  var idx = 0, score = 0, picked = -1, revealed = false;

  function done(){
    var earnedBefore = certificateEarned();
    try{
      var key = 'pp_quiz_scores';
      var all = {}; try{ all = JSON.parse(localStorage.getItem(key) || '{}'); }catch(e){}
      all['step_'+step] = { score: score, total: qs.length, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(all));
    }catch(e){}
    if(ov && ov.parentNode) ov.parentNode.removeChild(ov);
    var earnedNow = certificateEarned();
    if(!earnedBefore && earnedNow){
      // First-time achievement — show certificate, then continue when dismissed.
      try{ localStorage.setItem('pp_cert_awarded_at', String(Date.now())); }catch(e){}
      showHajjReadinessCertificate();
      var poll = setInterval(function(){
        if(!document.getElementById('ppCertOverlay')){ clearInterval(poll); onDone(); }
      }, 300);
      return;
    }
    onDone();
  }
  function renderDots(){
    var html = '';
    for(var i=0;i<qs.length;i++){
      html += '<span class="ppQuizDot'+(i<idx?' done':(i===idx?' on':''))+'"></span>';
    }
    dotsEl.innerHTML = html;
  }
  function render(){
    var q = qs[idx]; picked = -1; revealed = false;
    var html = '<h3>'+q.q+'</h3><div class="ppQuizOpts">';
    q.a.forEach(function(opt,i){
      html += '<button type="button" class="ppQuizOpt" data-i="'+i+'">'+opt+'</button>';
    });
    html += '</div><div class="ppQuizExplain"></div>';
    bodyEl.innerHTML = html;
    primary.textContent = (idx===qs.length-1) ? 'Finish \u203a' : 'Next \u203a';
    primary.disabled = true;
    primary.classList.add('disabled');
    bodyEl.querySelectorAll('.ppQuizOpt').forEach(function(b){
      b.addEventListener('click', function(){
        if(revealed) return;
        revealed = true;
        picked = parseInt(b.getAttribute('data-i'),10);
        var correct = qs[idx].correct;
        if(picked===correct){ score++; b.classList.add('correct'); }
        else { b.classList.add('wrong'); var cb = bodyEl.querySelector('.ppQuizOpt[data-i="'+correct+'"]'); if(cb) cb.classList.add('correct'); }
        bodyEl.querySelectorAll('.ppQuizOpt').forEach(function(x){ x.disabled = true; });
        var ex = bodyEl.querySelector('.ppQuizExplain');
        if(ex && qs[idx].why){ ex.textContent = qs[idx].why; ex.classList.add('visible'); }
        primary.disabled = false;
        primary.classList.remove('disabled');
      });
    });
    renderDots();
  }
  primary.addEventListener('click', function(){
    if(primary.disabled) return;
    idx++;
    if(idx >= qs.length){
      // Show final summary
      bodyEl.innerHTML = '<div class="ppQuizSummary"><div class="ppQuizScore">'+score+' / '+qs.length+'</div>'+
        '<p>'+ (score===qs.length ? 'Excellent! Mash\u0101\u02beAll\u0101h.' : (score>=Math.ceil(qs.length/2) ? 'Good work \u2014 keep reflecting.' : 'Take a moment to revisit this step\u2019s lesson.')) +'</p></div>';
      primary.textContent = 'Continue Journey \u203a';
      primary.disabled = false;
      var newP = primary.cloneNode(true);
      primary.parentNode.replaceChild(newP, primary);
      newP.addEventListener('click', done);
      return;
    }
    render();
  });
  skipBtn.addEventListener('click', done);
  render();
}

// Expose a single-line helper used by the Next-Stop button + menu
window.proceedWithQuiz = function(after){
  if(!quizEnabled()){ after(); return; }
  loadQuizContent(function(){ showQuizForCurrentStep(after); });
};

// ── Hajj Readiness Certificate modal ───────────────────────────────────────
function showHajjReadinessCertificate(){
  try{
    var u = (typeof readUser==='function') ? readUser() : {};
    var name = u.name || (u.email ? u.email.split('@')[0] : 'Pilgrim');
    var s = quizAggregateScore();
    var dateStr = new Date().toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
    var existing = document.getElementById('ppCertOverlay'); if(existing) existing.remove();
    var ov = document.createElement('div');
    ov.id = 'ppCertOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10060;background:rgba(20,12,4,0.78);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;font-family:\'DM Sans\',Arial,sans-serif;padding:20px;';
    ov.innerHTML =
      '<div style="width:min(94vw,640px);max-height:92vh;overflow:auto;background:linear-gradient(145deg,#FFFDF7,#F4EBD2);border:3px double #C9A84C;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,0.55);padding:32px 28px;text-align:center;color:#3D2B1F;position:relative;">'+
        '<button type="button" id="ppCertClose" aria-label="Close" style="position:absolute;top:10px;right:14px;background:transparent;border:none;font-size:26px;line-height:1;color:#8B6914;cursor:pointer;">&times;</button>'+
        '<div style="font-size:40px;line-height:1;margin-bottom:6px;">🏆</div>'+
        '<div style="font-family:\'Playfair Display\',serif;font-size:13px;letter-spacing:3px;color:#8B6914;text-transform:uppercase;">Pilgrim\'s Path · Hajj VR</div>'+
        '<h2 style="font-family:\'Playfair Display\',serif;font-size:30px;margin:6px 0 2px;color:#3D2B1F;">Hajj Readiness Certificate</h2>'+
        '<div style="height:2px;width:60px;background:#C9A84C;margin:12px auto 18px;"></div>'+
        '<p style="font-size:14px;margin:0 0 4px;color:#5a4530;">This is to certify that</p>'+
        '<p style="font-family:\'Playfair Display\',serif;font-size:26px;margin:6px 0 6px;color:#8B6914;font-weight:700;">'+ name +'</p>'+
        '<p style="font-size:14px;margin:6px 0 18px;color:#5a4530;line-height:1.55;">has successfully completed the <strong>Pilgrim\'s Path Hajj VR Journey</strong> and demonstrated knowledge of the rites of Hajj by scoring</p>'+
        '<div style="font-family:\'Playfair Display\',serif;font-size:38px;color:#22c55e;font-weight:700;margin:4px 0 2px;">'+ s.percent +'%</div>'+
        '<p style="font-size:12px;color:#8B6914;margin:0 0 22px;">('+ s.correct +' of '+ s.totalQuestions +' reflection questions answered correctly)</p>'+
        '<p style="font-size:13px;color:#5a4530;font-style:italic;margin:0 0 18px;">May Allah accept your intention and grant you a blessed pilgrimage.</p>'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px;font-size:12px;color:#5a4530;">'+
          '<div style="text-align:left;"><div style="border-top:1px solid #8B6914;padding-top:4px;min-width:140px;">Date issued</div><div style="margin-top:2px;font-weight:600;">'+ dateStr +'</div></div>'+
          '<div style="text-align:right;"><div style="border-top:1px solid #8B6914;padding-top:4px;min-width:140px;">Pilgrim\'s Path</div><div style="margin-top:2px;font-weight:600;">Hajj VR Program</div></div>'+
        '</div>'+
        '<div style="margin-top:22px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">'+
          '<button type="button" id="ppCertPrint" style="background:linear-gradient(135deg,#C9A84C,#8B6914);color:#fff;border:none;border-radius:10px;padding:10px 22px;font-size:13px;font-weight:600;cursor:pointer;">🖨  Print / Save PDF</button>'+
          '<button type="button" id="ppCertDone" style="background:rgba(139,105,20,0.12);color:#8B6914;border:1px solid #C9A84C;border-radius:10px;padding:10px 22px;font-size:13px;font-weight:600;cursor:pointer;">Close</button>'+
        '</div>'+
      '</div>';
    (_overlayRoot || document.body).appendChild(ov);
    function close(){ if(ov && ov.parentNode) ov.parentNode.removeChild(ov); }
    ov.querySelector('#ppCertClose').addEventListener('click', close);
    ov.querySelector('#ppCertDone').addEventListener('click', close);
    ov.querySelector('#ppCertPrint').addEventListener('click', function(){ try{ window.print(); }catch(e){} });
  }catch(e){ console.warn('[Cert] failed to render', e); }
}
try{ window.showHajjReadinessCertificate = showHajjReadinessCertificate; }catch(e){}

// ── Toggle 360° panorama auto-rotation on the active TDV tour script ──
// Returns true once at least one PanoramaPlayer was found and updated.
//
// Glitch-safe implementation: only touches `automaticRotationSpeed` on the
// PanoramaPlayer. We deliberately do NOT mutate idleSequence movements,
// camera.timeToIdle, manualRotationSpeed, initialSequence, or call
// pauseCamera()/resumeCamera() — all of those caused visible jerks and
// fought with normal scene transitions and hotspot navigation.
function setPanoramaRotation(enabled){
  try{
    var script = (window.TDV && TDV.PlayerAPI && TDV.PlayerAPI.getCurrentPlayer && TDV.PlayerAPI.getCurrentPlayer()) || null;
    if(!script || typeof script.getByClassName !== 'function') return false;
    var players = script.getByClassName('PanoramaPlayer') || [];
    if(!players.length) return false;
    players.forEach(function(p){
      try{
        if(!p || typeof p.get !== 'function' || typeof p.set !== 'function') return;
        if(enabled){
          if(p.__ppOrigAuto !== undefined){
            try{ p.set('automaticRotationSpeed', p.__ppOrigAuto); }catch(e){}
          }
        } else {
          if(p.__ppOrigAuto === undefined){
            try{ p.__ppOrigAuto = p.get('automaticRotationSpeed'); }catch(e){}
          }
          try{ p.set('automaticRotationSpeed', 0); }catch(e){}
        }
      }catch(e){}
    });
    return true;
  }catch(e){ return false; }
}

// ── Pause button + user menu ──
function initPauseMenu(){
  if(document.getElementById('ppPauseBtn')) return;

  // Restore previously chosen rotation-frozen state for this session.
  // We try ONCE the player is ready, then stop — do not poll continuously,
  // because re-applying during scene transitions caused visible glitches.
  try{ window._ppRotationFrozen = localStorage.getItem('pp_rotation_frozen') === '1'; }catch(e){}
  if(window._ppRotationFrozen){
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      if(setPanoramaRotation(false) || tries > 10){ clearInterval(t); }
    }, 600);
  }

  // Read registered user info captured by lead-capture / hajj-vr signup
  function readUser(){
    try{
      return {
        name:  localStorage.getItem('pp_lead_name')  || '',
        email: localStorage.getItem('pp_lead_email') || '',
        lang:  localStorage.getItem('pp_user_lang')  || 'en'
      };
    }catch(e){ return {name:'',email:'',lang:'en'}; }
  }

  var btn = document.createElement('button');
  btn.id = 'ppPauseBtn';
  btn.type = 'button';
  btn.setAttribute('aria-label','Pause and open menu');
  btn.title = 'Pause / Menu';
  btn.innerHTML = '<span class="ppPauseIcon" aria-hidden="true"><span></span><span></span></span>';
  _overlayRoot.appendChild(btn);

  var backdrop = document.createElement('div');
  backdrop.id = 'ppMenuBackdrop';
  _overlayRoot.appendChild(backdrop);

  var panel = document.createElement('aside');
  panel.id = 'ppMenuPanel';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-label','User menu');
  _overlayRoot.appendChild(panel);

  function renderPanel(){
    var u = readUser();
    var initial = (u.name || u.email || 'P').trim().charAt(0).toUpperCase();
    var displayName = u.name || (u.email ? u.email.split('@')[0] : 'Pilgrim');
    var progress = (window.jm && jm.getJourneyProgress) ? jm.getJourneyProgress() : {currentStep:0,totalSteps:16,percentage:0};
    var qz = quizAggregateScore();
    var earned = certificateEarned();
    var quizBlock = '';
    if(quizEnabled() || qz.totalQuestions > 0){
      var pct = qz.percent;
      var barColor = earned ? 'linear-gradient(90deg,#22c55e,#16a34a)' : (pct>=80 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : (pct>=50 ? 'linear-gradient(90deg,#C9A84C,#8B6914)' : 'linear-gradient(90deg,#94a3b8,#64748b)'));
      var statusLine;
      if(earned){
        statusLine = '🏆 Hajj Readiness Certificate earned!';
      } else if(qz.totalQuestions === 0){
        statusLine = 'Answer questions after each scene to earn your certificate.';
      } else {
        statusLine = 'Score 80%+ on 80% of questions to earn your certificate.';
      }
      quizBlock =
        '<div class="ppMenuProgress" style="margin-top:0;">' +
          '<div class="ppMenuProgLbl"><span>📝 Quiz score</span><span>' + qz.correct + ' / ' + qz.totalQuestions + ' &middot; ' + pct + '%</span></div>' +
          '<div class="ppMenuProgBar"><div class="ppMenuProgFill" style="width:' + pct + '%;background:' + barColor + ';"></div></div>' +
          '<div style="font-size:11px;color:' + (earned ? '#16a34a' : '#8B6914') + ';margin-top:6px;font-weight:' + (earned ? '700' : '500') + ';">' + statusLine + '</div>' +
        '</div>';
    }
    var certBtn = earned
      ? '<button type="button" data-act="cert" style="background:linear-gradient(135deg,#22c55e,#16a34a) !important;color:#fff !important;font-weight:700 !important;">🏆  View Hajj Readiness Certificate</button>'
      : '';
    panel.innerHTML =
      '<header class="ppMenuHead">' +
        '<div class="ppMenuAvatar">' + initial + '</div>' +
        '<div class="ppMenuWho">' +
          '<div class="ppMenuName">' + displayName + '</div>' +
          (u.email ? '<div class="ppMenuMail">' + u.email + '</div>' : '<div class="ppMenuMail">Guest pilgrim</div>') +
        '</div>' +
        '<button type="button" class="ppMenuClose" aria-label="Close menu">&times;</button>' +
      '</header>' +
      '<div class="ppMenuProgress">' +
        '<div class="ppMenuProgLbl"><span>Journey progress</span><span>' + progress.currentStep + ' / ' + progress.totalSteps + '</span></div>' +
        '<div class="ppMenuProgBar"><div class="ppMenuProgFill" style="width:' + progress.percentage + '%"></div></div>' +
      '</div>' +
      quizBlock +
      '<nav class="ppMenuList">' +
        '<button type="button" data-act="resume">▶  Resume Tour</button>' +
        '<button type="button" data-act="next">⏭  Next Stop</button>' +
        '<button type="button" data-act="rotate">🔄  Panorama Rotation  <span class="ppMenuMeta">' + (window._ppRotationFrozen ? 'OFF' : 'ON') + '</span></button>' +
        '<button type="button" data-act="quiz">📝  End-of-scene Quiz  <span class="ppMenuMeta">' + (quizEnabled() ? 'ON' : 'OFF') + '</span></button>' +
        certBtn +
        '<button type="button" data-act="restart">↻  Restart Scene</button>' +
        '<button type="button" data-act="reset">↺  Reset Progress</button>' +
        '<button type="button" data-act="exit">⏏  Exit to Dashboard</button>' +
      '</nav>' +
      '<footer class="ppMenuFoot">Pilgrim\'s Path · Hajj VR</footer>';

    panel.querySelector('.ppMenuClose').addEventListener('click', close);
    panel.querySelectorAll('.ppMenuList button').forEach(function(b){
      b.addEventListener('click', function(){ handleAct(b.getAttribute('data-act')); });
    });
  }

  function pauseAllAudio(){
    // Pause DOM <video>/<audio>
    document.querySelectorAll('video,audio').forEach(function(m){
      try{ if(!m.paused){ m.dataset.ppWasPlaying='1'; m.pause(); } }catch(e){}
    });
    // Pause the active voice-over (scenes set window._voAudio for the current line)
    try{
      if(window._voAudio && !window._voAudio.paused){
        window._voAudio._ppWasPlaying = true;
        window._voAudio.pause();
      }
    }catch(e){}
  }
  function resumeAllAudio(){
    document.querySelectorAll('video,audio').forEach(function(m){
      try{ if(m.dataset.ppWasPlaying==='1'){ delete m.dataset.ppWasPlaying; m.play().catch(function(){}); } }catch(e){}
    });
    try{
      if(window._voAudio && window._voAudio._ppWasPlaying){
        window._voAudio._ppWasPlaying = false;
        window._voAudio.play().catch(function(){});
      }
    }catch(e){}
  }
  function open(){
    renderPanel();
    document.body.classList.add('ppMenuOpen');
    var _fs = document.fullscreenElement || document.webkitFullscreenElement; if(_fs) _fs.classList.add('ppMenuOpen');
    pauseAllAudio();
    // Also freeze panorama auto-rotation while menu/pause is open
    try{ window._ppPauseRotated = !window._ppRotationFrozen; if(window._ppPauseRotated) setPanoramaRotation(false); }catch(e){}
  }
  function close(){
    document.body.classList.remove('ppMenuOpen');
    var _fs = document.fullscreenElement || document.webkitFullscreenElement; if(_fs) _fs.classList.remove('ppMenuOpen');
    resumeAllAudio();
    // Restore rotation only if pause was the one that froze it (don't override user-toggled OFF)
    try{ if(window._ppPauseRotated){ window._ppPauseRotated = false; setPanoramaRotation(true); } }catch(e){}
  }
  function handleAct(act){
    if(act==='resume'){ close(); return; }
    if(act==='next'){
      close();
      window.proceedWithQuiz(function(){ if(window.jm && jm.goToNext) jm.goToNext(); });
      return;
    }
    if(act==='rotate'){
      window._ppRotationFrozen = !window._ppRotationFrozen;
      setPanoramaRotation(!window._ppRotationFrozen);
      try{ localStorage.setItem('pp_rotation_frozen', window._ppRotationFrozen ? '1' : '0'); }catch(e){}
      renderPanel();
      return;
    }
    if(act==='quiz'){
      var on = !quizEnabled();
      try{ localStorage.setItem('pp_quiz_enabled', on ? '1' : '0'); }catch(e){}
      renderPanel();
      return;
    }
    if(act==='cert'){
      close();
      showHajjReadinessCertificate();
      return;
    }
    if(act==='restart'){
      // Replay the current scene from scratch.
      // Strategy: wipe in-memory + ALL sessionStorage (banner/VO/guide gates
      // live there under many different prefixes: jamar*, muz*, sai*, tawaf*,
      // pp_shown_*, etc.), then HARD navigate to the canonical step URL with
      // a fresh ?rs= so Chrome cannot short-circuit the navigation.
      // NOTE: localStorage is preserved (that holds journeyState + user prefs).
      try{
        if(window._voAudio){ try{ window._voAudio.pause(); }catch(_){} window._voAudio=null; }
        window._voCurrentFile=null; window._voPending=null; window._voChainPending=null;
        window._enforceLanded=false; window._stopEnforce=false;
        try{ sessionStorage.clear(); }catch(_){}
      }catch(_){}
      close();
      // HARD navigate. Build the URL from jm's step definition so we always
      // get the canonical scene URL (incl. ?journey & ?context), then add a
      // fresh ?rs= so the URL differs from the one already in the address bar.
      setTimeout(function(){
        try{
          var target;
          if(window.jm && jm.currentStep && typeof jm.getCurrentStep === 'function'){
            var step = jm.getCurrentStep();
            if(step && step.url){
              var sep1 = step.url.indexOf('?')>=0 ? '&' : '?';
              target = step.url + sep1 + 'journey=' + jm.currentStep +
                       (step.context ? '&context=' + encodeURIComponent(step.context) : '') +
                       '&rs=' + Date.now().toString(36);
            }
          }
          if(!target){
            var u = new URL(window.location.href);
            u.searchParams.delete('rs');
            u.searchParams.set('rs', Date.now().toString(36));
            target = u.toString();
          }
          window.location.replace(target);
        }catch(_){ window.location.reload(); }
      }, 80);
      return;
    }
    if(act==='reset'){
      if(confirm('Reset your Hajj journey progress and return to the start?')){
        if(window.jm && jm.resetJourney) jm.resetJourney();
        else { try{ localStorage.removeItem('journeyState'); }catch(e){} window.location.href = '/hajj-vr.html'; }
      }
      return;
    }
    if(act==='exit'){
      window.location.href = '/dashboard.html';
      return;
    }
  }

  btn.addEventListener('click', function(){
    var _fs = document.fullscreenElement || document.webkitFullscreenElement;
    var isOpen = document.body.classList.contains('ppMenuOpen') || (_fs && _fs.classList.contains('ppMenuOpen'));
    if(isOpen) close(); else open();
  });
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function(e){
    var _fs = document.fullscreenElement || document.webkitFullscreenElement;
    var isOpen = document.body.classList.contains('ppMenuOpen') || (_fs && _fs.classList.contains('ppMenuOpen'));
    if(e.key === 'Escape' && isOpen) close();
  });
}

// ── Inject CSS ──
const styleEl = document.createElement('style');
styleEl.textContent = journeyNavCSS;
document.head.appendChild(styleEl);

// ── Hide TDV's built-in "Choose Language" / locale switcher icon ─────────────
// 3DVista renders a corner button that overlaps our pause button. There's no
// stable id for it, so we identify it by its title / aria-label / visible text.
// We run an initial sweep + a MutationObserver to catch late-mounted elements.
(function hideLanguageUI(){
  var LANG_RE = /(choose\s*language|select\s*language|^language$|cambiar\s*idioma|elegir\s*idioma)/i;
  function matches(el){
    if(!el || el.nodeType !== 1) return false;
    var t = (el.getAttribute && (el.getAttribute('title') || el.getAttribute('aria-label'))) || '';
    if(LANG_RE.test(t)) return true;
    // Also check direct text content for icon-only buttons that have a tooltip span
    var txt = (el.textContent || '').trim();
    if(txt && txt.length < 40 && LANG_RE.test(txt)) return true;
    return false;
  }
  function hide(el){
    try{
      el.style.setProperty('display','none','important');
      el.style.setProperty('visibility','hidden','important');
      el.style.setProperty('pointer-events','none','important');
      el.setAttribute('data-pp-hidden-lang','1');
    }catch(_){}
  }
  function sweep(root){
    try{
      var nodes = (root || document).querySelectorAll('[title],[aria-label],button,div,span,a');
      for(var i=0;i<nodes.length;i++){
        if(matches(nodes[i])) hide(nodes[i]);
      }
    }catch(_){}
  }
  // Initial sweeps (TDV mounts UI asynchronously)
  sweep(document);
  setTimeout(function(){ sweep(document); }, 500);
  setTimeout(function(){ sweep(document); }, 1500);
  setTimeout(function(){ sweep(document); }, 3500);
  // Live observer
  try{
    var mo = new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        var m = muts[i];
        if(m.type === 'childList'){
          m.addedNodes && m.addedNodes.forEach(function(n){
            if(n.nodeType !== 1) return;
            if(matches(n)) hide(n);
            sweep(n);
          });
        } else if(m.type === 'attributes' && m.target && matches(m.target)){
          hide(m.target);
        }
      }
    });
    mo.observe(document.documentElement, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['title','aria-label']
    });
  }catch(_){}
})();

// ── Tear down any pre-mounted Pilgrims Path language pill on scene pages ────
// `journey-content-loader.js` historically mounted a floating #ppLangSwitcher
// on every page including scenes, where it overlapped the hamburger menu.
// The loader has been patched to skip scene pages, but this removes any
// instance left over from a cached older loader.
(function purgePpLangSwitcher(){
  function nuke(){
    try{
      var el = document.getElementById('ppLangSwitcher');
      if(el && el.parentNode) el.parentNode.removeChild(el);
      var st = document.getElementById('ppLangSwitcherCss');
      if(st && st.parentNode) st.parentNode.removeChild(st);
    }catch(_){}
  }
  nuke();
  setTimeout(nuke, 250);
  setTimeout(nuke, 1000);
  setTimeout(nuke, 3000);
  try{
    var mo = new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        var m = muts[i];
        if(m.type !== 'childList') continue;
        m.addedNodes && m.addedNodes.forEach(function(n){
          if(n.nodeType === 1 && (n.id === 'ppLangSwitcher' || n.id === 'ppLangSwitcherCss')){
            try{ n.parentNode && n.parentNode.removeChild(n); }catch(_){}
          }
        });
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }catch(_){}
})();

// ── Hide 3DVista's "Created by 3DVista Academic" watermark ──────────────────
// PRIMARY suppression is CSS (see journeyNavCSS) keyed on the unique base64
// data-URL signature `iVBORw0KGgoAAAANSUhEUgAAAcw`. This JS layer is a belt-
// and-braces backup that:
//   • Tags any matching node with [data-pp-watermark] (second CSS hook)
//   • Forces display:none inline with !important so even if the player's
//     8-second style-refresh interval runs, our hide rule wins
//   • Watches for late mounts via MutationObserver
//
// We deliberately do NOT remove the node from the DOM, because the player's
// internal interval calls Q.insertBefore(vt, ...) every 8s and would just
// re-attach it. Setting display:none is permanent (the player never touches
// the `display` property in its style refresh loop).
(function hideAcademicWatermark(){
  // Unique fingerprint from lib/tdvplayer.js → AcademicWatermark.g.xUa
  var WM_SIG = 'iVBORw0KGgoAAAANSUhEUgAAAcw';
  function isWatermark(el){
    if(!el || el.nodeType !== 1 || el.tagName !== 'DIV') return false;
    // Primary check: inline background-image contains the watermark base64 prefix
    var bg = el.style && el.style.backgroundImage;
    if(bg && bg.indexOf(WM_SIG) !== -1) return true;
    // Secondary check: classless/idless absolute div with z-index 1000 + bg-image
    if(!el.id && !(el.className && typeof el.className === 'string' && el.className.length)){
      var s = el.style;
      if(s && String(s.zIndex) === '1000' && bg && bg !== 'none' && bg !== '') return true;
    }
    return false;
  }
  function tag(el){
    try{
      el.setAttribute('data-pp-watermark','1');
      el.style.setProperty('display','none','important');
      el.style.setProperty('opacity','0','important');
      el.style.setProperty('visibility','hidden','important');
      el.style.setProperty('pointer-events','none','important');
    }catch(_){}
  }
  function sweep(){
    try{
      var divs = document.querySelectorAll('div');
      for(var i=0;i<divs.length;i++){ if(isWatermark(divs[i])) tag(divs[i]); }
    }catch(_){}
  }
  sweep();
  setTimeout(sweep, 250);
  setTimeout(sweep, 1000);
  setTimeout(sweep, 3000);
  setTimeout(sweep, 8500); // catch the player's first 8-second toggle
  try{
    var mo = new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        var m = muts[i];
        if(m.type === 'childList'){
          m.addedNodes && m.addedNodes.forEach(function(n){
            if(n.nodeType !== 1) return;
            if(isWatermark(n)) tag(n);
            if(n.querySelectorAll){
              var inner = n.querySelectorAll('div');
              for(var j=0;j<inner.length;j++){ if(isWatermark(inner[j])) tag(inner[j]); }
            }
          });
        } else if(m.type === 'attributes' && m.target && isWatermark(m.target)){
          tag(m.target);
        }
      }
    });
    mo.observe(document.documentElement, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['style']
    });
  }catch(_){}
})();

// ── Global functions for scenes to call ──
window.showJourneyNextButton = function() {
  // Remove existing button if present
  const existing = document.getElementById('nextStopBtn');
  if(existing) existing.remove();
  
  // Create next button
  const btn = document.createElement('button');
  btn.id = 'nextStopBtn';
  btn.textContent = 'Next Stop \u2192';
  btn.style.display = 'block';
  btn.addEventListener('click', function() {
    // Activity gate: if scene declares it requires an activity and it's not done, notify
    if(window.journeyRequiresActivity === true && window.journeyActivityComplete !== true){
      showActivityNotice(window.journeyActivityLabel || 'Please finish the current activity before moving on.');
      return;
    }
    window.proceedWithQuiz(function(){
      if(jm.currentStep < jm.getJourneyArray().length) {
        jm.goToNext();
      }
    });
  });
  
  _overlayRoot.appendChild(btn);
};

// ── Activity-required notice (toast near the Next button) ──
function showActivityNotice(msg){
  var el = document.getElementById('activityNotice');
  if(!el){
    el = document.createElement('div');
    el.id = 'activityNotice';
    _overlayRoot.appendChild(el);
  }
  el.textContent = '\u26A0\uFE0F  ' + msg;
  el.classList.add('visible');
  clearTimeout(el._hideT);
  el._hideT = setTimeout(function(){ el.classList.remove('visible'); }, 3500);
}
window.showActivityNotice = showActivityNotice;

// ── Onboarding "look for the path" cue ──
// Shown once per scene load, briefly, to teach users to scan the panorama.
// Long form on first scene + Mina; short form everywhere else.
function showPathCue(){
  try{
    var path = (window.location.pathname || '').toLowerCase();
    var search = (window.location.search || '').toLowerCase();
    // Decode the URL so "%20" becomes a real space (URL contains "/1%20Tawaf/" etc.)
    var decoded = '';
    try { decoded = decodeURIComponent(path).toLowerCase(); } catch(e){ decoded = path.replace(/%20/g,' '); }
    // Identify "first scene" — Tawaf with no/initial context (this is step 1 of the journey)
    var isFirst = /\/1\s*tawaf\//.test(decoded) && (!search || search.indexOf('context=initial')>=0 || search.indexOf('context=')<0);
    var isMina  = /\/3\s*mina\//.test(decoded);
    var longForm = isFirst || isMina;
    var msg = longForm
      ? '\uD83E\uDDED  Hajj is a journey of seeking \u2014 look for the path to move forward.'
      : '\uD83E\uDDED  Look for the path to move forward.';

    // Avoid stacking duplicates if this fn is invoked twice on the same page load
    if(document.getElementById('pathCueToast')) return;

    var t = document.createElement('div');
    t.id = 'pathCueToast';
    t.textContent = msg;
    _overlayRoot.appendChild(t);
    // Show after a short delay so it doesn't collide with banner opening
    setTimeout(function(){ t.classList.add('visible'); }, 1400);
    // Persist until the user navigates to a new panorama in this scene.
    // Scenes signal panorama changes by patching TDV.Tour.Script.setMainMediaByIndex / setPlayListSelectedIndex.
    // We piggyback on that by polling the current playlist selectedIndex.
    var startIdx = -1, settled = false;
    function curIdx(){
      try{
        var p = TDV.PlayerAPI.getCurrentPlayer();
        var pl = p && p.mainPlayList;
        if(pl) return pl.get('selectedIndex');
      }catch(e){}
      return -1;
    }
    var settleT = setInterval(function(){
      var i = curIdx();
      if(i >= 0 && !settled){ startIdx = i; settled = true; }
    }, 400);
    var pollT = setInterval(function(){
      if(!settled) return;
      var i = curIdx();
      if(i >= 0 && i !== startIdx){
        // Panorama changed — fade and remove
        clearInterval(pollT); clearInterval(settleT);
        t.classList.remove('visible');
        setTimeout(function(){ if(t && t.parentNode) t.parentNode.removeChild(t); }, 600);
      }
    }, 600);
    // Safety cap: 90s max so the cue can never get stuck on a broken page
    setTimeout(function(){
      clearInterval(pollT); clearInterval(settleT);
      if(t && t.parentNode){ t.classList.remove('visible'); setTimeout(function(){ if(t && t.parentNode) t.parentNode.removeChild(t); }, 600); }
    }, 90000);
  }catch(e){}
}
// Run after DOM ready so banners exist first
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(showPathCue, 600); });
} else {
  setTimeout(showPathCue, 600);
}

window.showJourneyComplete = function() {
  // Remove next button if exists
  const nextBtn = document.getElementById('nextStopBtn');
  if(nextBtn) nextBtn.remove();
  
  // Show completion banner
  const complete = document.createElement('div');
  complete.id = 'journeyComplete';
  complete.style.display = 'block';
  complete.innerHTML = `
    <h2>🕋 Hajj Complete!</h2>
    <p>Congratulations! You have completed all sacred rituals of Hajj.</p>
    <p class="subtext">May Allah accept your pilgrimage and forgive your sins.</p>
    <p>May you return home with increased faith and spiritual renewal.</p>
    <button onclick="window.jm.resetJourney()">Return Home</button>
  `;
  
  _overlayRoot.appendChild(complete);
};

// ── Initialize on DOM content loaded ──
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJourneyNav);
} else {
  initJourneyNav();
}

// ── Check for activity completion signals ──
// Scenes can set window.journeyIsLastPanorama = true or window.journeyActivityComplete = true
// The Next Stop button is ALWAYS shown on VR scenes (locked when an activity is required
// but not yet completed — clicking it then shows the activityNotice toast).
setInterval(function() {
  var btn = document.getElementById('nextStopBtn');
  if(!btn){
    showJourneyNextButton();
    btn = document.getElementById('nextStopBtn');
  }
  if(!btn) return;
  var requires = window.journeyRequiresActivity === true;
  var complete = window.journeyIsLastPanorama === true || window.journeyActivityComplete === true;
  if(requires && !complete){
    btn.classList.add('locked');
    btn.title = window.journeyActivityLabel || 'Finish the current activity to continue.';
  } else {
    btn.classList.remove('locked');
    btn.title = '';
  }
}, 600);

console.log('[JourneyNav] Initialized');

// ── Fullscreen overlay bridge ──
// JS-created overlays are already appended to _overlayRoot (#viewer) above,
// so they survive fullscreen without re-parenting. This bridge only needs to
// catch any fixed-position elements that scene HTML placed directly in <body>
// (e.g. #sceneBanner, #jamarHUD, scene-specific banners).
(function(){
  function onFsChange(){
    var viewer = document.getElementById('viewer');
    if(!viewer || !document.fullscreenElement) return;
    var kids = Array.prototype.slice.call(document.body.children);
    kids.forEach(function(el){
      try{
        if(window.getComputedStyle(el).position === 'fixed'){
          viewer.appendChild(el);
        }
      }catch(e){}
    });
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);
})();

// ── Disable 3DVista panorama-name tooltips via TDV Player API ──────────────
// The CSS selector (span[style*="pointer-events: none"]...) handles DOM-based
// tooltips. For the WebGL/3D-rendered tooltips used in panoramic mode we must
// use the player API. Setting displayTooltipInSurfaceSelection:false stops the
// panorama label from being surfaced as a tooltip when hovering transition areas.
(function disablePanoTooltips(){
  function attempt(){
    try{
      if(typeof TDV === 'undefined' || !TDV.PlayerAPI || typeof TDV.PlayerAPI.getCurrentPlayer !== 'function') return false;
      var p = TDV.PlayerAPI.getCurrentPlayer();
      if(!p) return false;
      p.set('displayTooltipInSurfaceSelection', false);
      return true;
    }catch(e){ return false; }
  }
  if(!attempt()){
    var tries = 0, iv = setInterval(function(){
      tries++;
      if(attempt() || tries > 20) clearInterval(iv);
    }, 500);
  }
})();

})();
