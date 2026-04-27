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
#journeyNav {
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
  padding: 14px 42px;
  font-size: 16px;
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

  .journey-dots {
    max-width: 150px;
    padding: 10px;
  }

  .journey-dot {
    width: 10px;
    height: 10px;
  }

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
  
  document.body.appendChild(complete);
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
