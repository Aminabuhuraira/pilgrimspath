// ═══ JOURNEY NAVIGATION UI INJECTOR ═══
// Injects progress indicators and navigation buttons into VR scenes
// Requires journey-manager.js to be loaded first

(function(){

// ── Ensure journey-manager is loaded ──
if(typeof jm === 'undefined'){
  console.error('[JourneyNav] journey-manager.js not loaded');
  return;
}

// ── CSS for navigation UI ──
const journeyNavCSS = `
/* Journey Navigation Container */
/* Hidden per design request — the bottom-right green completed-step dots were
   distracting and duplicated the bottom-rail (#scnRail) navigation. The
   container is still rendered so jm progress state stays wired, but it is
   visually removed from the VR scene. */
#journeyNav {
  display: none !important;
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 5000;
  font-family: 'DM Sans', Arial, sans-serif;
}

/* Step Dots Indicator */
.journey-dots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16px, 1fr));
  gap: 6px;
  background: rgba(10, 15, 30, 0.85);
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: 12px;
  padding: 12px;
  backdrop-filter: blur(8px);
  margin-bottom: 12px;
  max-width: 200px;
  justify-content: center;
}

.journey-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(201, 168, 76, 0.4);
  transition: all 0.3s;
  cursor: pointer;
}

.journey-dot.active {
  background: #C9A84C;
  border-color: #8B6914;
  box-shadow: 0 0 8px rgba(201, 168, 76, 0.6);
  transform: scale(1.3);
}

.journey-dot.completed {
  background: #22c55e;
  border-color: #16a34a;
}

.journey-dot:hover {
  transform: scale(1.15);
  background: rgba(201, 168, 76, 0.4);
}

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
  padding: 14px 24px;
  font-size: 15px;
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

/* Journey Complete Overlay */
#journeyComplete {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 6000;
  background: rgba(44, 24, 16, 0.82);
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

#journeyComplete > div {
  background: repeating-linear-gradient(45deg, transparent, transparent 14px, rgba(201,168,76,.045) 14px, rgba(201,168,76,.045) 15px),
              repeating-linear-gradient(-45deg, transparent, transparent 14px, rgba(201,168,76,.045) 14px, rgba(201,168,76,.045) 15px),
              #FAF5EB;
  border: 3px solid #C9A84C;
  border-radius: 24px;
  padding: 40px 44px;
  max-width: 600px;
  width: 100%;
  text-align: center;
  font-family: 'DM Sans', Arial, sans-serif;
  color: #2C1810;
  box-shadow: 0 0 0 4px #E8E0D4, 0 0 0 8px rgba(201,168,76,.35), 0 24px 64px rgba(0,0,0,.35);
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
  margin: 0 0 12px;
}

#journeyComplete .subtext {
  color: #6B5B4F;
  font-size: 14px;
  font-style: italic;
  margin: 0 0 16px;
}

#journeyComplete button {
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'DM Sans', Arial, sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(201,168,76,.3);
  transition: transform 0.15s;
}

#journeyComplete button:hover { transform: scale(1.04); }
#journeyComplete button:active { transform: scale(0.96); }

@media (max-width: 768px) {
  #journeyNav {
    bottom: 15px;
    right: 15px;
  }
  .journey-dots {
    max-width: 150px;
    padding: 10px;
  }
  .journey-dot {
    width: 10px;
    height: 10px;
  }
  #nextStopBtn {
    bottom: 168px;
    right: 15px;
    padding: 12px 20px;
    font-size: 14px;
  }
  #journeyComplete > div {
    padding: 28px 20px;
    border-radius: 18px;
  }
  #journeyComplete h2 { font-size: 22px; }
  #journeyComplete p  { font-size: 14px; }
}
`;

// ── Initialize UI on DOM Ready ──
function initJourneyNav() {
  // Create nav container
  const nav = document.createElement('div');
  nav.id = 'journeyNav';
  
  // Create dots container
  const dotsDiv = document.createElement('div');
  dotsDiv.className = 'journey-dots';
  dotsDiv.id = 'journeyDots';
  
  // Create dots for each step (skip every 2 if >10 steps)
  const journey = jm.getJourneyArray();
  const skipInterval = journey.length > 10 ? 2 : 1;
  
  journey.forEach((step, idx) => {
    if(idx % skipInterval === 0 || idx === journey.length - 1) {
      const dot = document.createElement('div');
      dot.className = 'journey-dot';
      dot.setAttribute('data-step', step.id);
      dot.title = step.name;
      
      if(step.id === jm.currentStep) {
        dot.classList.add('active');
      } else if(step.id < jm.currentStep) {
        dot.classList.add('completed');
      }
      
      dot.addEventListener('click', function() {
        if(step.id <= jm.currentStep) {
          jm.goToStep(step.id);
        }
      });
      
      dotsDiv.appendChild(dot);
    }
  });
  
  nav.appendChild(dotsDiv);
  document.body.appendChild(nav);
}

// ── Inject CSS ──
const styleEl = document.createElement('style');
styleEl.textContent = journeyNavCSS;
document.head.appendChild(styleEl);

// ── Global functions for scenes to call ──
window.showJourneyNextButton = function() {
  // Remove existing button if present
  const existing = document.getElementById('nextStopBtn');
  if(existing) existing.remove();
  
  // Create next button
  const btn = document.createElement('button');
  btn.id = 'nextStopBtn';
  btn.textContent = 'Next Stop →';
  btn.style.display = 'block';
  btn.addEventListener('click', function() {
    if(jm.currentStep < jm.getJourneyArray().length) {
      jm.goToNext();
    }
  });
  
  document.body.appendChild(btn);
};

// ── Certificate canvas renderer ──────────────────────────────────────
function _drawCertificate(pilgrimName, dateStr) {
  var W = 960, H = 680;
  var canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  var ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FDF6E3';
  ctx.fillRect(0, 0, W, H);

  // Outer border (gold double-line)
  ctx.strokeStyle = '#C9A227';
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, W - 28, H - 28);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(26, 26, W - 52, H - 52);

  // Corner ornaments
  function corner(x, y, dir) {
    var s = dir === 'tl' ? 1 : dir === 'tr' ? -1 : dir === 'bl' ? 1 : -1;
    var sy = (dir === 'tl' || dir === 'tr') ? 1 : -1;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#C9A227';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s * 10, sy * 40); ctx.lineTo(s * 10, sy * 10); ctx.lineTo(s * 40, sy * 10);
    ctx.stroke();
    ctx.restore();
  }
  corner(26, 26, 'tl'); corner(W - 26, 26, 'tr');
  corner(26, H - 26, 'bl'); corner(W - 26, H - 26, 'br');

  // Decorative horizontal rule under header area
  function hRule(y, alpha) {
    var grad = ctx.createLinearGradient(80, y, W - 80, y);
    grad.addColorStop(0, 'rgba(201,162,39,0)');
    grad.addColorStop(0.3, 'rgba(201,162,39,' + alpha + ')');
    grad.addColorStop(0.7, 'rgba(201,162,39,' + alpha + ')');
    grad.addColorStop(1, 'rgba(201,162,39,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(80, y - 1, W - 160, 2);
  }

  // Kaaba emoji
  ctx.font = '52px serif';
  ctx.textAlign = 'center';
  ctx.fillText('\uD83D\uDD4B', W / 2, 110);

  // Title
  ctx.fillStyle = '#8B6914';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.fillText('Hajj Readiness Certificate', W / 2, 168);

  hRule(190, 0.5);

  // Subtitle band
  ctx.fillStyle = '#5C4033';
  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillText('This certifies that', W / 2, 240);

  // Pilgrim name
  ctx.fillStyle = '#2C1810';
  ctx.font = 'bold 42px Georgia, serif';
  ctx.fillText(pilgrimName, W / 2, 308);

  hRule(330, 0.4);

  // Body copy
  ctx.fillStyle = '#5C4033';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('has successfully completed the full virtual Hajj preparation journey', W / 2, 376);
  ctx.fillText('on the Pilgrim\u2019s Path platform, covering all 16 rituals of Hajj.', W / 2, 402);

  hRule(430, 0.35);

  // Date
  ctx.fillStyle = '#7D5A45';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('Date of Completion: ' + dateStr, W / 2, 468);

  // Arabic blessing
  ctx.fillStyle = '#C9A227';
  ctx.font = '22px serif';
  ctx.fillText('\u062A\u0642\u0628\u0644 \u0627\u0644\u0644\u0647 \u0645\u0646\u0643 \u2014 May Allah accept from you', W / 2, 514);

  // Footer
  ctx.fillStyle = '#8B6914';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('\uD83D\uDD4B\uFE0F Pilgrim\u2019s Path', W / 2, 574);
  ctx.fillStyle = '#7D5A45';
  ctx.font = '12px Georgia, serif';
  ctx.fillText('pilgrimspath.io', W / 2, 594);

  return canvas;
}

window.showJourneyComplete = function() {
  // Remove next button if exists
  var nextBtn = document.getElementById('nextStopBtn');
  if (nextBtn) nextBtn.remove();

  // Retrieve pilgrim name from localStorage (set by dashboard on auth)
  var pilgrimName = localStorage.getItem('pp_user_display_name') || 'Valued Pilgrim';
  var now = new Date();
  var dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Persist certificate data for dashboard to pick up
  localStorage.setItem('pp_hajj_certified', '1');
  localStorage.setItem('pp_hajj_certified_name', pilgrimName);
  localStorage.setItem('pp_hajj_certified_date', dateStr);

  // ── Build congratulatory modal ──
  var overlay = document.createElement('div');
  overlay.id = 'journeyComplete';
  overlay.style.cssText = 'display:flex;align-items:center;justify-content:center;';

  overlay.innerHTML =
    '<div style="max-height:92vh;overflow-y:auto;padding:2px;">' +
    '<h2 style="font-size:26px;">\uD83C\uDF89 Mabrook, ' + pilgrimName + '!</h2>' +
    '<p style="font-size:16px;line-height:1.7;margin:0 0 6px;">You have completed the full virtual Hajj journey \u2014 all 16 sacred rituals, from Ihram through to Tawaf al-Wida.</p>' +
    '<p class="subtext">May Allah accept your preparation and grant you the opportunity to perform the real Hajj. \u0622\u0645\u064A\u0646</p>' +
    '<canvas id="certCanvas" style="width:100%;max-width:480px;border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,.18);margin:18px 0 8px;display:block;"></canvas>' +
    '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:4px;">' +
    '<button id="certDownloadBtn" style="background:linear-gradient(135deg,#C9A227,#8B6914);">\u2B07\uFE0F Download Certificate</button>' +
    '<a href="/dashboard" style="display:inline-flex;align-items:center;background:#2C1810;color:#fff;border:none;border-radius:12px;padding:14px 28px;font-size:15px;font-weight:600;text-decoration:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.2);">\uD83D\uDCCA Go to Dashboard</a>' +
    '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  // Render certificate into canvas
  var certCanvas = _drawCertificate(pilgrimName, dateStr);
  var el = document.getElementById('certCanvas');
  if (el) {
    el.width = certCanvas.width;
    el.height = certCanvas.height;
    el.getContext('2d').drawImage(certCanvas, 0, 0);
  }

  // Wire download button
  var dlBtn = document.getElementById('certDownloadBtn');
  if (dlBtn) {
    dlBtn.addEventListener('click', function () {
      var link = document.createElement('a');
      link.download = 'hajj-readiness-certificate.png';
      link.href = certCanvas.toDataURL('image/png');
      link.click();
    });
  }
};

// ── Initialize on DOM content loaded ──
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJourneyNav);
} else {
  initJourneyNav();
}

// ── Check for activity completion signals ──
// Scenes can set window.journeyIsLastPanorama = true or window.journeyActivityComplete = true
setInterval(function() {
  if(window.journeyIsLastPanorama === true || window.journeyActivityComplete === true) {
    if(!document.getElementById('nextStopBtn')) {
      showJourneyNextButton();
    }
  }
}, 500);

console.log('[JourneyNav] Initialized');

})();
