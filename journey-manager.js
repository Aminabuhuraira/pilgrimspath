// ═══ HAJJ JOURNEY STATE MANAGER ═══
// Central source of truth for the 14-step Hajj journey
// Manages navigation, progress tracking, and localStorage persistence

(function(){

// ─────────────────────────────────────────────────────────────
// 14-Step Hajj Journey Definition
// All URLs are relative to the server root (no leading slash)
// ─────────────────────────────────────────────────────────────
const HAJJ_JOURNEY = [
  {id: 1, step: 1, name: 'Tawaf (Initial)', url: '/journey/tawaf/index.htm', type: 'vr', context: 'initial'},
  {id: 2, step: 2, name: 'Safa & Marwa', url: '/journey/sai/index.htm', type: 'vr', context: 'sa-i'},
  {id: 3, step: 3, name: 'Mina (8th Day)', url: '/journey/mina/index.htm', type: 'vr', context: '8th-day'},
  {id: 4, step: 4, name: 'Arafah (9th Day)', url: '/journey/arafah/index.htm', type: 'vr', context: '9th-day'},
  {id: 5, step: 5, name: 'Muzdalifah', url: '/journey/muzdalifah/index.htm', type: 'vr', context: 'pebbles'},
  {id: 6, step: 6, name: 'Jamarat (10th Day)', url: '/journey/jamarat-rooftop/index.htm', type: 'vr', context: '10th-day'},
  {id: 7, step: 7, name: 'Qurbani (Sacrifice)', url: '/journey/rami/qurbani-scene.html', type: 'html', context: 'sacrifice'},
  {id: 8, step: 8, name: 'Barber (Hair Shaving)', url: '/journey/rami/barber-scene.html', type: 'html', context: 'barber'},
  {id: 9, step: 9, name: 'Tawaf al-Ifadha', url: '/journey/tawaf/index.htm', type: 'vr', context: 'ifadha'},
  {id: 10, step: 10, name: 'Jamarat (11th Day)', url: '/journey/jamarat-rooftop/index.htm', type: 'vr', context: '11th-day'},
  {id: 11, step: 11, name: 'Jamarat (12th Day)', url: '/journey/jamarat-rooftop/index.htm', type: 'vr', context: '12th-day'},
  {id: 12, step: 12, name: 'Jamarat (13th Day)', url: '/journey/jamarat-rooftop/index.htm', type: 'vr', context: '13th-day'},
  {id: 13, step: 13, name: 'Tawaf al-Wida (Farewell)', url: '/journey/tawaf/index.htm', type: 'vr', context: 'farewell'},
  {id: 14, step: 14, name: 'Hajj Complete', url: '#', type: 'final', context: 'complete'}
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
      const url = step.url + (step.type === 'vr' ? `?journey=${index}&context=${step.context}` : `?journey=${index}`);
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
  console.log('[JourneyManager] Initialized. Current step:', window.jm.currentStep);
}

})();
