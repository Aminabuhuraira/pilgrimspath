/**
 * scene-landing-prompt.js
 * Shows a landing choice overlay when a pilgrim arrives at an HTML scene.
 * Two choices:
 *   "Continue Exploring"  → dismisses overlay, user reads scene content
 *   "Move to Next Scene"  → dismisses overlay then triggers the scene's
 *                           own continue-button (with quiz/VO flow intact)
 *
 * Each scene configures this via:
 *   window._ppLandingCfg  = { icon, title, subtitle }
 *   window._ppLandingProceed = function(){...}   // optional override
 */
(function () {
  'use strict';

  /* ── wait for DOM then delay 900 ms so the scene card animates in first ── */
  function whenReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { setTimeout(fn, 900); });
    } else {
      setTimeout(fn, 900);
    }
  }

  function init() {
    var cfg = window._ppLandingCfg || {};
    var icon     = cfg.icon     || '🕌';
    var title    = cfg.title    || 'You Have Arrived';
    var subtitle = cfg.subtitle || 'Take a moment to explore this station — or continue your journey.';

    /* ── only show once per page session ── */
    var sessionKey = 'pp_lp_' + (window._sceneNavCurrent || location.pathname);
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');

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
        /* icon */
        '<div style="font-size:2.8rem;margin-bottom:12px;line-height:1">',icon,'</div>',
        /* title */
        '<h2 style="',
          'font-family:Georgia,serif;font-size:1.3rem;font-weight:700;',
          'color:#1a1a2e;margin:0 0 10px;line-height:1.3',
        '">',title,'</h2>',
        /* divider */
        '<div style="',
          'width:48px;height:2px;margin:0 auto 14px;',
          'background:linear-gradient(90deg,transparent,rgba(201,168,76,0.7),transparent)',
        '"></div>',
        /* subtitle */
        '<p style="',
          'font-family:Poppins,sans-serif;font-size:0.88rem;',
          'color:#5a4a3a;line-height:1.65;margin:0 0 24px',
        '">',subtitle,'</p>',
        /* buttons */
        '<div style="display:flex;flex-direction:column;gap:11px">',
          /* Explore button */
          '<button id="ppLandingExploreBtn" style="',
            'padding:13px 22px;border-radius:50px;',
            'border:2px solid rgba(201,168,76,0.65);background:transparent;',
            'color:#8B6914;font-family:Poppins,sans-serif;',
            'font-size:0.95rem;font-weight:600;cursor:pointer;',
            'transition:background 0.2s,border-color 0.2s',
          '">🔍 Continue Exploring</button>',
          /* Proceed button */
          '<button id="ppLandingProceedBtn" style="',
            'padding:14px 22px;border-radius:50px;border:none;',
            'background:linear-gradient(135deg,#D4AF37,#C9A227,#B8941F);',
            'color:#fff;font-family:Poppins,sans-serif;',
            'font-size:0.95rem;font-weight:600;cursor:pointer;',
            'box-shadow:0 6px 22px rgba(201,162,39,0.45);',
            'transition:transform 0.15s,box-shadow 0.15s',
          '">▸ Move to Next Scene</button>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(ov);

    /* ── fade in ── */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { ov.style.opacity = '1'; });
    });

    /* ── hover effect on explore button ── */
    var exploreBtn = document.getElementById('ppLandingExploreBtn');
    var proceedBtn = document.getElementById('ppLandingProceedBtn');

    exploreBtn.addEventListener('mouseover', function () {
      this.style.background = 'rgba(201,168,76,0.08)';
      this.style.borderColor = 'rgba(201,168,76,1)';
    });
    exploreBtn.addEventListener('mouseout', function () {
      this.style.background = 'transparent';
      this.style.borderColor = 'rgba(201,168,76,0.65)';
    });
    proceedBtn.addEventListener('mouseover', function () {
      this.style.transform = 'translateY(-2px) scale(1.02)';
      this.style.boxShadow = '0 8px 28px rgba(201,162,39,0.6)';
    });
    proceedBtn.addEventListener('mouseout', function () {
      this.style.transform = '';
      this.style.boxShadow = '0 6px 22px rgba(201,162,39,0.45)';
    });

    /* ── dismiss helper ── */
    function dismiss() {
      ov.style.opacity = '0';
      setTimeout(function () {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
      }, 420);
    }

    /* ── Explore: just close overlay ── */
    exploreBtn.addEventListener('click', dismiss);

    /* ── Proceed: close then trigger the scene's own continue flow ── */
    proceedBtn.addEventListener('click', function () {
      dismiss();
      setTimeout(function () {
        /* 1. scene-specific override */
        if (typeof window._ppLandingProceed === 'function') {
          window._ppLandingProceed();
          return;
        }
        /* 2. auto-detect the primary continue button in this scene */
        var continueSel = [
          '#continueBtn',
          '.continue-btn',
          '#umrahTrimContinue',
          '#barberContinue',
          '#qurbaniContinue'
        ].join(',');
        var btn = document.querySelector(continueSel);
        if (btn) {
          btn.click();
          return;
        }
        /* 3. fallback: journey manager goToNext (also triggers quiz) */
        if (window.jm && typeof window.jm.goToNext === 'function') {
          window.jm.goToNext();
          return;
        }
        /* 4. last resort: show the journey nav next button if visible */
        var jnb = document.getElementById('journeyNextBtn') || document.querySelector('[id*="journeyNext"]');
        if (jnb) jnb.click();
      }, 450); /* slight delay so overlay fade is done */
    });
  }

  whenReady(init);
})();
