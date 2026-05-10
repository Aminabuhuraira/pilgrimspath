/**
 * scene-landing-prompt.js
 * Exposes window.ppShowLandingPrompt(cfg) — call it from VR panorama hooks
 * to show a choice overlay asking the pilgrim to explore or move on.
 *
 * cfg = {
 *   icon      : string  (emoji)
 *   title     : string
 *   subtitle  : string
 *   onExplore : function()  — called when user picks "Continue Exploring"
 *   onProceed : function()  — called when user picks "Move to Next Scene"
 * }
 */
(function () {
  'use strict';

  window.ppShowLandingPrompt = function (cfg) {
    cfg = cfg || {};
    var icon     = cfg.icon     || '🕌';
    var title    = cfg.title    || 'You Have Arrived';
    var subtitle = cfg.subtitle || 'Take a moment to explore — or continue your journey.';
    var onExplore = typeof cfg.onExplore === 'function' ? cfg.onExplore : function () {};
    var onProceed = typeof cfg.onProceed === 'function' ? cfg.onProceed : function () {};

    /* guard: only one prompt open at a time */
    if (document.getElementById('ppLandingPrompt')) return;

    /* ── build overlay ── */
    var ov = document.createElement('div');
    ov.id = 'ppLandingPrompt';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', title);
    ov.style.cssText = [
      'position:fixed;inset:0;z-index:99900',
      'display:flex;align-items:center;justify-content:center',
      'background:rgba(10,8,6,0.70)',
      'backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)',
      'padding:16px',
      'opacity:0;transition:opacity 0.4s ease'
    ].join(';');

    ov.innerHTML = [
      '<div style="',
        'background:rgba(255,252,242,0.98);',
        'border-radius:22px;',
        'border:1.5px solid rgba(201,168,76,0.50);',
        'box-shadow:0 0 0 5px rgba(201,168,76,0.10),0 24px 64px rgba(0,0,0,0.50);',
        'max-width:460px;width:100%;',
        'padding:36px 30px 28px;',
        'text-align:center;',
        'font-family:Georgia,serif;',
      '">',
        '<div style="font-size:2.8rem;margin-bottom:12px;line-height:1">',icon,'</div>',
        '<h2 style="font-family:Georgia,serif;font-size:1.3rem;font-weight:700;color:#1a1a2e;margin:0 0 10px;line-height:1.3">',title,'</h2>',
        '<div style="width:48px;height:2px;margin:0 auto 14px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.7),transparent)"></div>',
        '<p style="font-family:Poppins,sans-serif;font-size:0.88rem;color:#5a4a3a;line-height:1.65;margin:0 0 24px">',subtitle,'</p>',
        '<div style="display:flex;flex-direction:column;gap:11px">',
          '<button id="ppLandingExploreBtn" style="padding:13px 22px;border-radius:50px;border:2px solid rgba(201,168,76,0.65);background:transparent;color:#8B6914;font-family:Poppins,sans-serif;font-size:0.95rem;font-weight:600;cursor:pointer;transition:background 0.2s,border-color 0.2s">🔍 Continue Exploring</button>',
          '<button id="ppLandingProceedBtn" style="padding:14px 22px;border-radius:50px;border:none;background:linear-gradient(135deg,#D4AF37,#C9A227,#B8941F);color:#fff;font-family:Poppins,sans-serif;font-size:0.95rem;font-weight:600;cursor:pointer;box-shadow:0 6px 22px rgba(201,162,39,0.45);transition:transform 0.15s,box-shadow 0.15s">▸ Move to Next Scene</button>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(ov);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { ov.style.opacity = '1'; });
    });

    var exploreBtn = document.getElementById('ppLandingExploreBtn');
    var proceedBtn = document.getElementById('ppLandingProceedBtn');

    exploreBtn.addEventListener('mouseover', function () { this.style.background='rgba(201,168,76,0.08)'; this.style.borderColor='rgba(201,168,76,1)'; });
    exploreBtn.addEventListener('mouseout',  function () { this.style.background='transparent'; this.style.borderColor='rgba(201,168,76,0.65)'; });
    proceedBtn.addEventListener('mouseover', function () { this.style.transform='translateY(-2px) scale(1.02)'; this.style.boxShadow='0 8px 28px rgba(201,162,39,0.6)'; });
    proceedBtn.addEventListener('mouseout',  function () { this.style.transform=''; this.style.boxShadow='0 6px 22px rgba(201,162,39,0.45)'; });

    function dismiss() {
      ov.style.opacity = '0';
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 420);
    }

    exploreBtn.addEventListener('click', function () {
      dismiss();
      setTimeout(onExplore, 450);
    });

    proceedBtn.addEventListener('click', function () {
      dismiss();
      setTimeout(onProceed, 450);
    });
  };
})();
