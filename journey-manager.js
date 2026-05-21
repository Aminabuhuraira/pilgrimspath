// ═══ HAJJ JOURNEY STATE MANAGER ═══
// Central source of truth for the 16-step Hajj journey
// Manages navigation, progress tracking, and localStorage + server persistence.
// Progress is synced to /api/user-progress (Supabase-backed) so a logged-in
// user sees the same journey state on every device they log in from.

(function(){

// ─────────────────────────────────────────────────────────────
// 16-Step Hajj Journey Definition
// All URLs are relative to the server root (no leading slash)
// ─────────────────────────────────────────────────────────────
const HAJJ_JOURNEY = [
  {id: 1,  step: 1,  name: 'Tawaf x7',                      url: '/journey/tawaf/index.htm',               type: 'vr',   context: 'initial'},
  {id: 2,  step: 2,  name: "Sa'i — Safa & Marwa",          url: '/journey/sai/index.htm',                 type: 'vr',   context: 'sa-i'},
  {id: 3,  step: 3,  name: 'Clip/Shave Hair (Umrah)',       url: '/journey/rami/umrah-trim-scene.html',    type: 'html', context: 'umrah-trim'},
  {id: 4,  step: 4,  name: 'Resting & Praying',             url: '/journey/ihram/rest-scene.html',         type: 'html', context: 'rest'},
  {id: 5,  step: 5,  name: 'Re-enter State of Ihram',       url: '/journey/ihram/ihram-scene.html',        type: 'html', context: 're-enter'},
  {id: 6,  step: 6,  name: 'Arrive at Mina (8th Day)',      url: '/journey/mina/index.htm',               type: 'vr',   context: '8th-day'},
  {id: 7,  step: 7,  name: 'Day of Arafah',                 url: '/journey/arafah/index.htm',             type: 'vr',   context: '9th-day'},
  {id: 8,  step: 8,  name: 'Muzdalifah',                    url: '/journey/muzdalifah/index.htm',         type: 'vr',   context: 'pebbles'},
  {id: 9,  step: 9,  name: 'Rami al-Aqabah (10th Day)',     url: '/journey/jamarat-aqabah/index.htm',     type: 'vr',   context: '10th-day'},
  {id: 10, step: 10, name: 'Qurbani (Sacrifice)',           url: '/journey/rami/qurbani-scene.html',      type: 'html', context: 'sacrifice'},
  {id: 11, step: 11, name: 'Shave Head (Halaq)',            url: '/journey/rami/barber-scene.html',       type: 'html', context: 'barber'},
  {id: 12, step: 12, name: 'Tawaf al-Ifadha',               url: '/journey/tawaf/index.htm',              type: 'vr',   context: 'ifadha'},
  {id: 13, step: 13, name: 'Rami — All Pillars (11th Day)', url: '/journey/jamarat-rooftop/index.htm',    type: 'vr',   context: '11th-day'},
  {id: 14, step: 14, name: 'Spend Night at Mina',           url: '/journey/mina/index.htm',               type: 'vr',   context: 'tents-12th'},
  {id: 15, step: 15, name: 'Rami — All Pillars (12th Day)', url: '/journey/jamarat-base-12/index.htm',    type: 'vr',   context: '12th-day'},
  {id: 16, step: 16, name: "Farewell Tawaf al-Wida'",     url: '/journey/tawaf/index.htm',              type: 'vr',   context: 'farewell'}
];

// ─────────────────────────────────────────────────────────────
// Server-sync helpers (gracefully degrade when not logged in)
// ─────────────────────────────────────────────────────────────

// Extract the Supabase session JWT from storage without requiring auth.js.
// The Supabase client stores the token under 'sb-<projectRef>-auth-token'
// in whichever storage was active when the user logged in.
function _getJwt() {
  try {
    var key = 'sb-giftctxrqvlfekhzpcaa-auth-token';
    var raw = (window.sessionStorage && window.sessionStorage.getItem(key))
           || (window.localStorage   && window.localStorage.getItem(key));
    if (!raw) return null;
    var d = JSON.parse(raw);
    // Handle both { access_token } and older { session: { access_token } } shapes
    return d && (d.access_token || (d.session && d.session.access_token)) || null;
  } catch (_) { return null; }
}

// POST current state to /api/user-progress (fire-and-forget).
function _pushToServer(currentStep, currentContext, completedSteps) {
  var jwt = _getJwt();
  if (!jwt) return;
  var umrahCompleted = false;
  try { umrahCompleted = !!localStorage.getItem('pp_umrah_completed'); } catch (_) {}
  var body = JSON.stringify({
    journey_state: { currentStep: currentStep, currentContext: currentContext, completedSteps: completedSteps },
    umrah_completed: umrahCompleted
  });
  fetch('/api/user-progress', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: body
  }).catch(function () {});
}

// GET saved state from /api/user-progress and merge into localStorage + instance.
// Calls onDone(didUpdate) when finished (true = server had newer/more progress).
function _pullFromServer(instance, onDone) {
  var jwt = _getJwt();
  if (!jwt) { if (onDone) onDone(false); return; }
  fetch('/api/user-progress', {
    credentials: 'include',
    headers: { 'Authorization': 'Bearer ' + jwt }
  })
  .then(function (r) {
    if (r.status === 204 || !r.ok) return null;
    return r.json();
  })
  .then(function (data) {
    if (!data || !data.journey_state) { if (onDone) onDone(false); return; }
    var srv   = data.journey_state;
    var srvStep = parseInt(srv.currentStep, 10) || 0;
    var srvDone = Array.isArray(srv.completedSteps) ? srv.completedSteps : [];
    var didUpdate = false;

    // Adopt server state if it represents MORE progress (step is further,
    // or same step but more completed steps recorded).
    if (srvStep > instance.currentStep ||
        (srvStep === instance.currentStep && srvDone.length > instance.completedSteps.length)) {
      instance.currentStep    = srvStep;
      instance.currentContext = srv.currentContext || '';
      instance.completedSteps = srvDone;
      try {
        localStorage.setItem('journeyState', JSON.stringify({
          currentStep:    instance.currentStep,
          currentContext: instance.currentContext,
          completedSteps: instance.completedSteps
        }));
      } catch (_) {}
      didUpdate = true;
    }

    // Always restore umrah_completed flag if server says it's done
    if (data.umrah_completed) {
      try { localStorage.setItem('pp_umrah_completed', '1'); } catch (_) {}
    }

    if (onDone) onDone(didUpdate);
  })
  .catch(function () { if (onDone) onDone(false); });
}

// ── JourneyManager Class ──
class JourneyManager {
  constructor(){
    this.loadState();
  }

  loadState(){
    // Phase 1 — synchronous: populate from localStorage immediately so the UI
    // is never blocked waiting for a network request.
    try {
      const saved = localStorage.getItem('journeyState');
      if (saved) {
        const data = JSON.parse(saved);
        this.currentStep    = data.currentStep    || 0;
        this.currentContext = data.currentContext || '';
        this.completedSteps = data.completedSteps || [];
      } else {
        this.currentStep    = 0;
        this.currentContext = '';
        this.completedSteps = [];
      }
    } catch (_) {
      this.currentStep    = 0;
      this.currentContext = '';
      this.completedSteps = [];
    }

    // Phase 2 — async: fetch from server and override if server has more progress.
    // Fires a 'jm:synced' event on window when complete so the dashboard (and
    // any page that needs it) can re-render after server data arrives.
    const self = this;
    setTimeout(function () {
      _pullFromServer(self, function (didUpdate) {
        try {
          var evt = new CustomEvent('jm:synced', { detail: { didUpdate: didUpdate } });
          window.dispatchEvent(evt);
        } catch (_) {}
      });
    }, 0);
  }

  saveState(){
    const state = {
      currentStep:    this.currentStep,
      currentContext: this.currentContext,
      completedSteps: this.completedSteps
    };
    try { localStorage.setItem('journeyState', JSON.stringify(state)); } catch (_) {}
    // Push to server asynchronously (no await — never blocks navigation)
    _pushToServer(this.currentStep, this.currentContext, this.completedSteps);
  }

  getCurrentStep(){
    return this.currentStep > 0 && this.currentStep <= HAJJ_JOURNEY.length 
      ? HAJJ_JOURNEY[this.currentStep - 1] 
      : null;
  }

  getNextStep(){
    if(this.currentStep < HAJJ_JOURNEY.length){
      return HAJJ_JOURNEY[this.currentStep];
    }
    return null;
  }

  getPreviousStep(){
    if(this.currentStep > 1){
      return HAJJ_JOURNEY[this.currentStep - 2];
    }
    return null;
  }

  markComplete(stepId){
    if(stepId && this.completedSteps.indexOf(stepId) === -1){
      this.completedSteps.push(stepId);
      this.saveState();
    }
  }

  goToStep(index){
    if(index >= 1 && index <= HAJJ_JOURNEY.length){
      const step = HAJJ_JOURNEY[index - 1];
      // Mark the current step as completed before advancing
      if(this.currentStep > 0){
        const prev = HAJJ_JOURNEY[this.currentStep - 1];
        if(prev && this.completedSteps.indexOf(prev.id) === -1){
          this.completedSteps.push(prev.id);
        }
      }
      this.currentStep = index;
      this.currentContext = step.context;
      this.saveState();
      
      // Special handling for final step (completion)
      if(step.type === 'final'){
        if(typeof window.showJourneyComplete === 'function'){
          window.showJourneyComplete();
        }
        return;
      }
      
      // Navigate to the step URL
      const joiner = step.url.indexOf('?') === -1 ? '?' : '&';
      const url = step.url + joiner + `journey=${index}` + (step.context ? `&context=${step.context}` : '');
      window.location.href = url;
    }
  }

  goToNext(){
    if(this.currentStep < HAJJ_JOURNEY.length){
      this.goToStep(this.currentStep + 1);
    } else if(this.currentStep === HAJJ_JOURNEY.length){
      // Journey complete - show completion banner
      if(typeof window.showJourneyComplete === 'function'){
        window.showJourneyComplete();
      }
    }
  }

  goToPrevious(){
    if(this.currentStep > 1){
      this.goToStep(this.currentStep - 1);
    }
  }

  beginJourney(){
    this.goToStep(1);
  }

  resetJourney(){
    this.currentStep    = 0;
    this.currentContext = '';
    this.completedSteps = [];
    this.saveState();
    window.location.reload();
  }

  getJourneyProgress(){
    return {
      currentStep:      this.currentStep,
      totalSteps:       HAJJ_JOURNEY.length,
      percentage:       Math.round((this.currentStep / HAJJ_JOURNEY.length) * 100),
      stepsRemaining:   Math.max(0, HAJJ_JOURNEY.length - this.currentStep)
    };
  }

  isJourneyComplete(){
    return this.currentStep >= HAJJ_JOURNEY.length;
  }

  getJourneyArray(){
    return HAJJ_JOURNEY;
  }
}

// ── Create Global Instance ──
if(typeof window !== 'undefined'){
  window.jm = new JourneyManager();
  console.log('[JourneyManager] Initialized. Current step:', window.jm.currentStep);
}

})();

