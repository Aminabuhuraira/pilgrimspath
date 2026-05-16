// ═══ HAJJ JOURNEY STATE MANAGER ═══
// Central source of truth for the 18-step Hajj journey
// Manages navigation, progress tracking, and localStorage persistence

(function(){

// ─────────────────────────────────────────────────────────────
// 18-Step Hajj Journey Definition
// All URLs are relative to the server root (no leading slash)
// ─────────────────────────────────────────────────────────────
const HAJJ_JOURNEY = [
  // ── Umrah rituals (within Hajj al-Tamattu') ──
  // Note: Ihram prep/enter info is embedded inside the Tawaf scene's built-in guide
  {id: 1,  step: 1,  name: 'Tawaf x7',                      url: '/journey/tawaf/index.htm',               type: 'vr',   context: 'initial'},
  {id: 2,  step: 2,  name: "Sa'i — Safa & Marwa",           url: '/journey/sai/index.htm?v=3',  type: 'vr',   context: 'sa-i'},
  {id: 3,  step: 3,  name: 'Clip/Shave Hair (Umrah)',        url: '/journey/rami/umrah-trim-scene.html', type: 'html', context: 'umrah-trim'},
  {id: 4,  step: 4,  name: 'Resting & Praying',             url: '/journey/ihram/rest-scene.html',         type: 'html', context: 'rest'},
  {id: 5,  step: 5,  name: 'Re-enter State of Ihram',       url: '/journey/ihram/ihram-scene.html',         type: 'html', context: 're-enter'},
  // ── Hajj rituals ──
  {id: 6,  step: 6,  name: 'Arrive at Mina (8th Day)',      url: '/journey/mina/index.htm',               type: 'vr',   context: '8th-day'},
  {id: 7,  step: 7,  name: 'Day of Arafah',                 url: '/journey/arafah/index.htm',             type: 'vr',   context: '9th-day'},
  {id: 8,  step: 8,  name: 'Muzdalifah',                    url: '/journey/muzdalifah/index.htm',              type: 'vr',   context: 'pebbles'},
  {id: 9,  step: 9,  name: 'Rami al-Aqabah (10th Day)',     url: '/journey/jamarat-aqabah/index.htm?v=3', type: 'vr', context: '10th-day'},
  {id: 10, step: 10, name: 'Qurbani (Sacrifice)',           url: '/journey/rami/qurbani-scene.html', type: 'html', context: 'sacrifice'},
  {id: 11, step: 11, name: 'Shave Head (Halaq)',            url: '/journey/rami/barber-scene.html', type: 'html', context: 'barber'},
  {id: 12, step: 12, name: 'Tawaf al-Ifadha',              url: '/journey/tawaf/index.htm',               type: 'vr',   context: 'ifadha'},
  {id: 13, step: 13, name: 'Rami — All Pillars (11th Day)', url: '/journey/jamarat-rooftop/index.htm?v=3', type: 'vr', context: '11th-day'},
  {id: 14, step: 14, name: 'Spend Night at Mina',          url: '/journey/mina/index.htm',               type: 'vr',   context: 'tents-12th'},
  {id: 15, step: 15, name: 'Rami — All Pillars (12th Day)', url: '/journey/jamarat-base-12/index.htm?v=17', type: 'vr', context: '12th-day'},
  {id: 16, step: 16, name: "Farewell Tawaf al-Wida'",      url: '/journey/tawaf/index.htm',               type: 'vr',   context: 'farewell'},
];

// ── JourneyManager Class ──
class JourneyManager {
  constructor(){
    this.loadState();
  }

  loadState(){
    // Load from localStorage
    const saved = localStorage.getItem('journeyState');
    if(saved){
      const data = JSON.parse(saved);
      this.currentStep = data.currentStep || 0;
      this.currentContext = data.currentContext || '';
      this.completedSteps = data.completedSteps || [];
    } else {
      this.currentStep = 0;
      this.currentContext = '';
      this.completedSteps = [];
    }
  }

  saveState(){
    localStorage.setItem('journeyState', JSON.stringify({
      currentStep: this.currentStep,
      currentContext: this.currentContext,
      completedSteps: this.completedSteps
    }));
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

  goToStep(index){
    if(index >= 1 && index <= HAJJ_JOURNEY.length){
      const step = HAJJ_JOURNEY[index - 1];
      // Mark the step we are leaving as completed when moving forward.
      // (Backward navigation does NOT un-complete steps already finished.)
      if(this.currentStep > 0 && index > this.currentStep){
        if(!Array.isArray(this.completedSteps)) this.completedSteps = [];
        if(this.completedSteps.indexOf(this.currentStep) === -1){
          this.completedSteps.push(this.currentStep);
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
      
      // Navigate to the step URL — always include both journey index and context
      const url = step.url + `?journey=${index}` + (step.context ? `&context=${step.context}` : '');
      window.location.href = url;
    }
  }

  goToNext(){
    if(this.currentStep < HAJJ_JOURNEY.length){
      // Quiz is always triggered by the caller (Next Stop button or pause menu).
      // Do not call proceedWithQuiz here — it would show a second set of questions.
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
    this.currentStep = 0;
    this.currentContext = '';
    this.completedSteps = [];
    this.saveState();
    window.location.reload();
  }

  getJourneyProgress(){
    return {
      currentStep: this.currentStep,
      totalSteps: HAJJ_JOURNEY.length,
      percentage: Math.round((this.currentStep / HAJJ_JOURNEY.length) * 100),
      stepsRemaining: Math.max(0, HAJJ_JOURNEY.length - this.currentStep)
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

  // ── Auto-sync currentStep from URL ?journey=N param ──
  // This way every scene that loads with ?journey=N will update state
  try {
    const params = new URLSearchParams(window.location.search);
    const jParam = parseInt(params.get('journey') || '0', 10);
    if(jParam >= 1 && jParam <= HAJJ_JOURNEY.length){
      const step = HAJJ_JOURNEY[jParam - 1];
      window.jm.currentStep = jParam;
      window.jm.currentContext = params.get('context') || step.context;
      // mark previous steps as completed
      for(let i=1; i<jParam; i++){
        if(window.jm.completedSteps.indexOf(i) === -1){
          window.jm.completedSteps.push(i);
        }
      }
      window.jm.saveState();
    }
  } catch(e){ /* no-op */ }

  console.log('[JourneyManager] Initialized. Current step:', window.jm.currentStep);
}

})();
