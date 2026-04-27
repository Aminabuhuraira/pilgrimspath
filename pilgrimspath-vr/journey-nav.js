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
  display: none; /* legacy dots container disabled */
}

/* ═══ Pause button + user menu ═══ */
#ppPauseBtn {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 10020;
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

#ppMenuBackdrop {
  position: fixed;
  inset: 0;
  z-index: 10018;
  background: rgba(8,5,2,0.55);
  backdrop-filter: blur(2px);
  opacity: 0;
  pointer-events: none;
  transition: opacity .18s;
}
body.ppMenuOpen #ppMenuBackdrop { opacity: 1; pointer-events: auto; }

#ppMenuPanel {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  z-index: 10019;
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
`;

// ── Initialize UI on DOM Ready ──
function initJourneyNav() {
  // Right-side progress dots have been removed per UX request — the bottom
  // step icon strip (scene-nav-overlay.js) now serves as the sole progress UI.
  // Inject the pause / user-menu instead.
  initPauseMenu();
}

// ═══ QUIZ — Optional post-scene reflection ═══
// Triggered when the user clicks "Next Stop" if they opted in on hajj-vr.html.
// Questions are loaded from /pilgrimspath-vr/quiz-content.js (PPQuiz.questions[step]).
function quizEnabled(){
  try{ return localStorage.getItem('pp_quiz_enabled') === '1'; }catch(e){ return false; }
}
function loadQuizContent(cb){
  if(window.PPQuiz && window.PPQuiz.questions){ cb(); return; }
  var s = document.createElement('script');
  s.src = '/pilgrimspath-vr/quiz-content.js?v=1';
  s.onload = cb;
  s.onerror = function(){ console.warn('[Quiz] failed to load content'); cb(); };
  document.head.appendChild(s);
}
function showQuizForCurrentStep(onDone){
  var step = (window.jm && jm.currentStep) ? jm.currentStep : 0;
  var qs = (window.PPQuiz && window.PPQuiz.questions && window.PPQuiz.questions[step]) || null;
  if(!qs || !qs.length){ onDone(); return; }
  // Build modal
  var ov = document.createElement('div');
  ov.id = 'ppQuizOverlay';
  ov.innerHTML = '<div class="ppQuizCard">'+
    '<header><span class="ppQuizBadge">Reflection \u2022 Step '+step+'</span>'+
    '<button type="button" class="ppQuizSkip" aria-label="Skip">Skip \u203a</button></header>'+
    '<div class="ppQuizBody"></div>'+
    '<footer><div class="ppQuizDots"></div><button type="button" class="ppQuizPrimary">Next \u203a</button></footer>'+
    '</div>';
  document.body.appendChild(ov);
  var bodyEl = ov.querySelector('.ppQuizBody');
  var dotsEl = ov.querySelector('.ppQuizDots');
  var primary = ov.querySelector('.ppQuizPrimary');
  var skipBtn = ov.querySelector('.ppQuizSkip');
  var idx = 0, score = 0, picked = -1, revealed = false;

  function done(){
    try{
      var key = 'pp_quiz_scores';
      var all = {}; try{ all = JSON.parse(localStorage.getItem(key) || '{}'); }catch(e){}
      all['step_'+step] = { score: score, total: qs.length, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(all));
    }catch(e){}
    if(ov && ov.parentNode) ov.parentNode.removeChild(ov);
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
  document.body.appendChild(btn);

  var backdrop = document.createElement('div');
  backdrop.id = 'ppMenuBackdrop';
  document.body.appendChild(backdrop);

  var panel = document.createElement('aside');
  panel.id = 'ppMenuPanel';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-label','User menu');
  document.body.appendChild(panel);

  function renderPanel(){
    var u = readUser();
    var initial = (u.name || u.email || 'P').trim().charAt(0).toUpperCase();
    var displayName = u.name || (u.email ? u.email.split('@')[0] : 'Pilgrim');
    var progress = (window.jm && jm.getJourneyProgress) ? jm.getJourneyProgress() : {currentStep:0,totalSteps:16,percentage:0};
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
      '<nav class="ppMenuList">' +
        '<button type="button" data-act="resume">▶  Resume Tour</button>' +
        '<button type="button" data-act="next">⏭  Next Stop</button>' +
        '<button type="button" data-act="rotate">🔄  Panorama Rotation  <span class="ppMenuMeta">' + (window._ppRotationFrozen ? 'OFF' : 'ON') + '</span></button>' +
        '<button type="button" data-act="quiz">📝  End-of-scene Quiz  <span class="ppMenuMeta">' + (quizEnabled() ? 'ON' : 'OFF') + '</span></button>' +
        '<button type="button" data-act="lang">🌐  Language  <span class="ppMenuMeta">' + u.lang.toUpperCase() + '</span></button>' +
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
    pauseAllAudio();
    // Also freeze panorama auto-rotation while menu/pause is open
    try{ window._ppPauseRotated = !window._ppRotationFrozen; if(window._ppPauseRotated) setPanoramaRotation(false); }catch(e){}
  }
  function close(){
    document.body.classList.remove('ppMenuOpen');
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
    if(act==='lang'){
      var cur = (localStorage.getItem('pp_user_lang') || 'en');
      var order = ['en','ar','fr','ur','tr','id','ms','sw','ha'];
      var nxt = order[(order.indexOf(cur)+1) % order.length];
      try{ localStorage.setItem('pp_user_lang', nxt); }catch(e){}
      renderPanel();
      // Soft reload current scene so audio/text picks the new lang
      setTimeout(function(){ window.location.reload(); }, 250);
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
    if(document.body.classList.contains('ppMenuOpen')) close(); else open();
  });
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && document.body.classList.contains('ppMenuOpen')) close();
  });
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
  
  document.body.appendChild(btn);
};

// ── Activity-required notice (toast near the Next button) ──
function showActivityNotice(msg){
  var el = document.getElementById('activityNotice');
  if(!el){
    el = document.createElement('div');
    el.id = 'activityNotice';
    document.body.appendChild(el);
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
    document.body.appendChild(t);
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

})();
