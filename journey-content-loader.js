/* ═══════════════════════════════════════════════════════════════════
   PILGRIM'S PATH — Journey Content Loader
   Reads admin overrides from localStorage and exposes them to scenes.
   Same-origin localStorage is shared between /admin.html and the VR scenes
   so any save from the admin tab is visible (with live reload via storage event).
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
var KEY = 'pp_journey_content_v1';
var LANG_KEY = 'pp_user_lang';
var AUDIO_BASE = '/Hajj%20Voice%20Over/';
var data = null;
try{ data = JSON.parse(localStorage.getItem(KEY)); }catch(e){}
var lang = localStorage.getItem(LANG_KEY) || 'en';

// Diagnostics so the user can verify in DevTools that the latest admin data is loaded
try{
  var sv = (data && data.seedVersion) || 0;
  var sc = (data && data.scenes) ? data.scenes.length : 0;
  console.log('[PPContent] loaded localStorage data — seedVersion='+sv+', scenes='+sc+', lang='+lang+(data?'':' (no admin data, falling back to scene HTML)'));
}catch(_){ }

function getScene(k){ if(!data||!data.scenes) return null; return data.scenes.find(function(s){return s.key===k;}); }
function pick(obj){ if(!obj) return null; return obj[lang] || obj.en || null; }
function audioFile(b){ return pick(b&&b.audio); }
function audioChainFile(b){ return pick(b&&b.audioChain); }
function textFor(b){ return pick(b&&b.text); }
function audioUrl(file){ if(!file) return ''; if(/^(https?:|data:|blob:)/i.test(file)) return file; return AUDIO_BASE + encodeURIComponent(file); }

function audioMapByPano(sceneKey){
  var s=getScene(sceneKey); if(!s) return {};
  var m={};
  // Include ALL panorama-trigger banners — even if audio is empty — so admin
  // "cleared" audio properly overrides hardcoded scene fallbacks (Object.assign-merge semantics).
  s.banners.forEach(function(b){ if(b.trigger==='panorama' && b.panorama){ m[b.panorama]=audioFile(b)||''; } });
  return m;
}
function bannerMapByPano(sceneKey){
  var s=getScene(sceneKey); if(!s) return {};
  var m={};
  // Include ALL panorama-trigger banners so admin edits (including clearing
  // text) propagate. Scenes can skip rendering empty banners themselves.
  s.banners.forEach(function(b){ if(b.trigger==='panorama' && b.panorama){ var t=textFor(b)||{}; m[b.panorama]={title:t.title||'',html:t.body||'',template:b.template||'classic-gold',position:b.position||{x:50,y:50}}; } });
  return m;
}
function byId(sceneKey,id){
  var s=getScene(sceneKey); if(!s) return null;
  var b=s.banners.find(function(x){return x.id===id;}); if(!b) return null;
  var t=textFor(b)||{};
  return { title:t.title||'', html:t.body||'', audio:audioFile(b)||'', audioChain:audioChainFile(b)||'', template:b.template||'classic-gold', position:b.position||{x:50,y:50} };
}
function bySequence(sceneKey){
  var s=getScene(sceneKey); if(!s) return [];
  return s.banners
    .filter(function(b){return /^sequence-/.test(b.trigger);})
    .sort(function(a,b){return a.trigger.localeCompare(b.trigger);})
    .map(function(b){var t=textFor(b)||{}; return {title:t.title||'',html:t.body||'',audio:audioFile(b)||'',template:b.template||'classic-gold',position:b.position||{x:50,y:50}};});
}

/* Apply a banner template + position to the scene's banner element.
   Call this after rendering the banner. The template CSS is read from
   PPJourneyContent.templates (loaded from admin-journey-content.js) but
   when running outside admin we ship a minimal inline registry below. */
var SCENE_TEMPLATES = {
  'classic-gold': '', // fallback to scene's own #sceneBanner CSS
  'parchment-frame': 'background:radial-gradient(ellipse at center,#f7ecd0 0%,#e8d8a8 70%,#d4be7d 100%) !important;border:none !important;border-radius:6px !important;font-family:Georgia,serif !important;color:#3a2410 !important;clip-path:polygon(2% 0,98% 1%,100% 50%,99% 99%,1% 98%,0 50%)',
  'minimal-glass': 'background:rgba(255,255,255,.12) !important;backdrop-filter:blur(18px) !important;-webkit-backdrop-filter:blur(18px) !important;border:1px solid rgba(255,255,255,.25) !important;border-radius:18px !important;color:#fff !important',
  'ornate-arabesque': 'background:#0d1421 !important;border:2px solid #D4AF37 !important;border-radius:0 !important;color:#f4ead5 !important;font-family:"Amiri",Georgia,serif !important',
  'royal-emerald': 'background:linear-gradient(135deg,#0a3a2a,#0e5238 50%,#0a3a2a) !important;border:2px solid #D4AF37 !important;border-radius:12px !important;color:#f0e8c8 !important;font-family:Georgia,serif !important',
  'compact-pill': 'background:rgba(20,12,4,.92) !important;border:1px solid rgba(201,168,76,.55) !important;border-radius:24px !important;color:#F4E4BC !important;width:auto !important;min-height:auto !important;max-width:420px !important;padding:14px 24px !important',
  'hero-large': 'background:linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%) !important;border:3px solid #D4AF37 !important;border-radius:20px !important;color:#fff !important;font-family:Georgia,serif !important;width:min(96vw,820px) !important',
  'side-card': 'background:linear-gradient(180deg,#fffbe9,#f5edd0) !important;border:none !important;border-left:4px solid #C9A84C !important;border-radius:8px !important;color:#2C1810 !important;width:auto !important;max-width:380px !important;min-height:auto !important;padding:18px 22px !important;text-align:left !important',
  'midnight-blue': 'background:radial-gradient(ellipse at top,#1e3a5f,#0d1b2a) !important;border:1px solid #D4AF37 !important;border-radius:14px !important;color:#e8eef4 !important',
  'sunrise-gold': 'background:linear-gradient(135deg,#FFE5B4 0%,#FFD98A 50%,#E8B860 100%) !important;border:2px solid #B8941F !important;border-radius:16px !important;color:#3D2B1F !important',
  'ihram-guide': '' // ihram screens use their own card CSS
};

function applyTemplate(elementSelector, tplId, pos){
  setTimeout(function(){
    var el = document.querySelector(elementSelector); if(!el) return;
    var styles = SCENE_TEMPLATES[tplId]||'';
    if(styles){
      el.setAttribute('data-pp-tpl', tplId);
      // Append/replace style attribute additions
      var existing = el.getAttribute('style')||'';
      // Remove previous template styles
      existing = existing.replace(/\/\*PPTPL\*\/[^]*?\/\*\/PPTPL\*\//g,'');
      el.setAttribute('style', existing + '/*PPTPL*/'+styles+'/*\/PPTPL*/');
    }
    if(pos && (pos.x!=null||pos.y!=null)){
      // Override default centering with absolute % position
      var pStyles = ';left:'+(pos.x||50)+'% !important;top:'+(pos.y||50)+'% !important;transform:translate(-50%,-50%) !important;';
      var cur = el.getAttribute('style')||'';
      cur = cur.replace(/\/\*PPPOS\*\/[^]*?\/\*\/PPPOS\*\//g,'');
      el.setAttribute('style', cur + '/*PPPOS*/'+pStyles+'/*\/PPPOS*/');
    }
  }, 60);
}

window.PPContent = {
  lang: lang,
  hasData: !!data,
  getScene: getScene,
  audioMapByPano: audioMapByPano,
  bannerMapByPano: bannerMapByPano,
  byId: byId,
  bySequence: bySequence,
  audioUrl: audioUrl,
  applyTemplate: applyTemplate,
  setLang: function(l){ localStorage.setItem(LANG_KEY,l); location.reload(); }
};

// Live preview: reload scene when admin saves changes
window.addEventListener('storage', function(e){
  if(e.key===KEY || e.key===LANG_KEY){
    if(window._voAudio){ try{window._voAudio.pause();}catch(_){} }
    location.reload();
  }
});
})();
