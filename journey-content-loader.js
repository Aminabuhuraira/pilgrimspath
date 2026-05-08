/* ═══════════════════════════════════════════════════════════════════
  PILGRIM'S PATH — Journey Content Loader (v5)
   Reads admin overrides from localStorage and exposes them to scenes.

   v4 additions:
   • Per-language audio folder (loader picks the right MP3 for the
     pilgrim's chosen language).
   • Floating user-facing language switcher (top-right pill).
   • Generic button-trigger wiring: any banner whose trigger='button'
     and buttonId is set is auto-bound to the matching DOM button.
   • Completion banner wrapper: when a scene calls
     showJourneyNextButton(), an admin-defined completion banner +
     voice-over plays first, then the Next Stop button appears.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
if(window.location && window.location.protocol === 'http:' && window.location.hostname === 'localhost' && window.location.port === '3000'){
  window.location.replace('http://127.0.0.1:3000' + window.location.pathname + window.location.search + window.location.hash);
  return;
}
var KEY = 'pp_journey_content_v1';
var LANG_KEY = 'pp_user_lang';
var AUDIO_BASE_ROOT = '/Hajj%20voiceover%20english/';
var DEFAULT_LANG_FOLDERS = {en:'English/',ar:'Arabic/',fr:'French/',ur:'Urdu/',tr:'Turkish/',id:'Indonesian/',ms:'Malay/',es:'Spanish/',fa:'Persian/'};
var data = null;
try{ data = JSON.parse(localStorage.getItem(KEY)); }catch(e){}
// If the admin content script is present, force its load/resync path to run so
// seed-version updates and newly added default banners propagate into existing data.
if(window.PPJourneyContent && typeof window.PPJourneyContent.get === 'function'){
  try{
    window.PPJourneyContent.get('tawaf-initial','tw-guide-0','en');
    data = JSON.parse(localStorage.getItem(KEY));
  }catch(e){ console.warn('[PPContent v5] admin sync failed', e); }
}
function migrateMistakenStep15CompletionData(){
  if(!data || !data.scenes) return;
  var scene = data.scenes.find(function(s){ return s.key === 'jamarat-12th'; });
  if(!scene || !scene.banners) return;
  var day13 = scene.banners.find(function(b){ return b.id === 'jm12-day13-option'; });
  var complete = scene.banners.find(function(b){ return b.id === 'jm12-complete'; });
  if(!day13 || !complete) return;
  var wrongTitle = 'Well-done on completing the stoning ritual';
  var wrongBody = '<p class="bb">Well-done on completing the stoning ritual on this day, you have the choice to either:</p><p class="bb">Leave Mina to perform your final tawaf early.</p><p class="bb">or</p><p class="bb">Remain in Mina to continue the ritual on the 13th day.</p>';
  var wrongAudio = '29 English 12th day dhul hijjah 2.mp3';
  var oldDay13Title = (((day13.text||{}).en||{}).title) || '';
  var oldDay13Body = (((day13.text||{}).en||{}).body) || '';
  var oldDay13Audio = ((day13.audio||{}).en) || '';
  if(oldDay13Title !== wrongTitle || oldDay13Body !== wrongBody || oldDay13Audio !== wrongAudio) return;
  day13.text = day13.text || {};
  day13.text.en = day13.text.en || {};
  day13.audio = day13.audio || {};
  day13.text.en.title = '🌙 Decision: Stay or Leave Mina';
  day13.text.en.body = '<p class="bb">You have two options:</p><p class="bb"><strong>Option 1 — Depart today (12th):</strong> You may leave Mina before sunset and proceed to Masjid al-Haram for Tawaf al-Wida.</p><p class="bb"><strong>Option 2 — Stay until 13th:</strong> If you remain at Mina until after sunrise on the 13th, you must perform the stoning again (21 pebbles across the three pillars) before departing.</p>';
  day13.audio.en = '30 English Day 13 dhul hijjah 1.mp3';
  complete.text = complete.text || {};
  complete.text.en = complete.text.en || {};
  complete.audio = complete.audio || {};
  complete.template = 'midnight-blue';
  complete.text.en.title = wrongTitle;
  complete.text.en.body = wrongBody;
  complete.audio.en = wrongAudio;
  try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(_){ }
}
// Self-seed defaults from admin script (if present) so first-time visitors
// who haven't opened admin still get full content + correct audio file names.
if(!data && window.PPJourneyContent && typeof window.PPJourneyContent.get === 'function'){
  try{
    window.PPJourneyContent.get('tawaf-initial','tw-guide-0','en'); // triggers admin's load() which seeds localStorage with DEFAULT_DATA
    data = JSON.parse(localStorage.getItem(KEY));
    console.log('[PPContent v4] auto-seeded defaults from admin DEFAULT_DATA');
  }catch(e){ console.warn('[PPContent v4] auto-seed failed', e); }
}
migrateMistakenStep15CompletionData();
var lang = localStorage.getItem(LANG_KEY) || 'en';

try{
  var sv = (data && data.seedVersion) || 0;
  var sc = (data && data.scenes) ? data.scenes.length : 0;
  console.log('[PPContent v4] loaded — seedVersion='+sv+', scenes='+sc+', lang='+lang+(data?'':' (no admin data, falling back to scene HTML)'));
}catch(_){ }

/* ─── Helpers ─── */
function getScene(k){ if(!data||!data.scenes) return null; return data.scenes.find(function(s){return s.key===k;}); }
function pick(obj){
  if(!obj) return null;
  // Per-language with smart fallback to English so scenes never go silent
  return obj[lang] || obj.en || (Object.keys(obj).length?obj[Object.keys(obj)[0]]:null);
}
function audioFile(b){ return pick(b&&b.audio); }
function audioChainFile(b){ return pick(b&&b.audioChain); }
function textFor(b){ return pick(b&&b.text); }

function langEntry(code){
  var ls = (data && data.languages) || [];
  return ls.find(function(l){return l.code===code;}) || (code==='en'?{code:'en',name:'English',folder:'English/'}:null);
}
function langFolder(code){
  var L = langEntry(code);
  var f = (L && L.folder) || DEFAULT_LANG_FOLDERS[code] || 'English/';
  if(f && !/\/$/.test(f)) f += '/';
  return f;
}
function audioUrl(file, optLang){
  if(!file) return '';
  if(/^(https?:|data:|blob:)/i.test(file)) return file;
  var folder = langFolder(optLang || lang);
  return AUDIO_BASE_ROOT + folder.split('/').filter(Boolean).map(encodeURIComponent).join('/') + '/' + encodeURIComponent(file);
}

/* ─── Public maps ─── */
function audioMapByPano(sceneKey){
  var s=getScene(sceneKey); if(!s) return {};
  var m={};
  s.banners.forEach(function(b){ if(b.trigger==='panorama' && b.panorama){ m[b.panorama]=audioFile(b)||''; } });
  return m;
}
function audioChainMapByPano(sceneKey){
  var s=getScene(sceneKey); if(!s) return {};
  var m={};
  s.banners.forEach(function(b){ if(b.trigger==='panorama' && b.panorama){ m[b.panorama]=audioChainFile(b)||''; } });
  return m;
}
function bannerMapByPano(sceneKey){
  var s=getScene(sceneKey); if(!s) return {};
  var m={};
  s.banners.forEach(function(b){ if(b.trigger==='panorama' && b.panorama){ var t=textFor(b)||{}; m[b.panorama]={title:t.title||'',html:t.body||'',template:b.template||'classic-gold',position:b.position||{x:50,y:50}}; } });
  return m;
}
function byId(sceneKey,id){
  var s=getScene(sceneKey); if(!s) return null;
  var b=s.banners.find(function(x){return x.id===id;}); if(!b) return null;
  var t=textFor(b)||{};
  return { title:t.title||'', html:t.body||'', audio:audioFile(b)||'', audioChain:audioChainFile(b)||'', template:b.template||'classic-gold', position:b.position||{x:50,y:50}, buttonId:b.buttonId||'', buttonLabel:b.buttonLabel||'' };
}
function bySequence(sceneKey){
  var s=getScene(sceneKey); if(!s) return [];
  return s.banners
    .filter(function(b){return /^sequence-/.test(b.trigger);})
    .sort(function(a,b){return a.trigger.localeCompare(b.trigger);})
    .map(function(b){var t=textFor(b)||{}; return {title:t.title||'',html:t.body||'',audio:audioFile(b)||'',template:b.template||'classic-gold',position:b.position||{x:50,y:50}};});
}
function byButton(sceneKey){
  var s=getScene(sceneKey); if(!s) return [];
  return s.banners
    .filter(function(b){return b.trigger==='button';})
    .map(function(b){var t=textFor(b)||{}; return {id:b.id,buttonId:b.buttonId||'',buttonLabel:b.buttonLabel||'',title:t.title||'',html:t.body||'',audio:audioFile(b)||'',audioChain:audioChainFile(b)||'',template:b.template||'classic-gold',position:b.position||{x:50,y:50}};});
}
function byCompletion(sceneKey){
  var s=getScene(sceneKey); if(!s) return null;
  var candidates = s.banners.filter(function(b){return b.trigger==='completion';});
  var b = candidates.find(function(x){ return /-complete$/i.test(x.id||''); })
    || candidates.find(function(x){ var t=textFor(x)||{}; return audioFile(x) || t.body || t.title; })
    || candidates[0];
  if(!b) return null;
  var t=textFor(b)||{};
  return { id:b.id, title:t.title||'', html:t.body||'', audio:audioFile(b)||'', template:b.template||'sunrise-gold', position:b.position||{x:50,y:50} };
}

/* ─── Templates ─── */
var SCENE_TEMPLATES = {
  'classic-gold': '',
  'parchment-frame': 'background:radial-gradient(ellipse at center,#f7ecd0 0%,#e8d8a8 70%,#d4be7d 100%) !important;border:none !important;border-radius:6px !important;font-family:Georgia,serif !important;color:#3a2410 !important;clip-path:polygon(2% 0,98% 1%,100% 50%,99% 99%,1% 98%,0 50%)',
  'minimal-glass': 'background:rgba(255,255,255,.12) !important;backdrop-filter:blur(18px) !important;-webkit-backdrop-filter:blur(18px) !important;border:1px solid rgba(255,255,255,.25) !important;border-radius:18px !important;color:#fff !important',
  'ornate-arabesque': 'background:#0d1421 !important;border:2px solid #D4AF37 !important;border-radius:0 !important;color:#f4ead5 !important;font-family:"Amiri",Georgia,serif !important',
  'royal-emerald': 'background:linear-gradient(135deg,#0a3a2a,#0e5238 50%,#0a3a2a) !important;border:2px solid #D4AF37 !important;border-radius:12px !important;color:#f0e8c8 !important;font-family:Georgia,serif !important',
  'compact-pill': 'background:rgba(20,12,4,.92) !important;border:1px solid rgba(201,168,76,.55) !important;border-radius:24px !important;color:#F4E4BC !important;width:auto !important;min-height:auto !important;max-width:420px !important;padding:14px 24px !important',
  'hero-large': 'background:linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%) !important;border:3px solid #D4AF37 !important;border-radius:20px !important;color:#fff !important;font-family:Georgia,serif !important;width:min(96vw,820px) !important',
  'side-card': 'background:linear-gradient(180deg,#fffbe9,#f5edd0) !important;border:none !important;border-left:4px solid #C9A84C !important;border-radius:8px !important;color:#2C1810 !important;width:auto !important;max-width:380px !important;min-height:auto !important;padding:18px 22px !important;text-align:left !important',
  'midnight-blue': 'background:radial-gradient(ellipse at top,#1e3a5f,#0d1b2a) !important;border:1px solid #D4AF37 !important;border-radius:14px !important;color:#e8eef4 !important',
  'sunrise-gold': 'background:linear-gradient(135deg,#FFE5B4 0%,#FFD98A 50%,#E8B860 100%) !important;border:2px solid #B8941F !important;border-radius:16px !important;color:#3D2B1F !important',
  'ihram-guide': ''
};
/* h3 title colour override for light-background templates.
   The base banner injects h3 with color:#D4AF37 (gold) which is near-invisible
   on warm/cream backgrounds. These overrides inject a <style> rule to fix it. */
var TPL_H3_COLORS = {
  'sunrise-gold':    '#8B4513',
  'side-card':       '#2C1810',
  'parchment-frame': '#3a2410'
};

function applyTemplate(elementSelector, tplId, pos){
  setTimeout(function(){
    var el = document.querySelector(elementSelector); if(!el) return;
    var styles = SCENE_TEMPLATES[tplId]||'';
    if(styles){
      el.setAttribute('data-pp-tpl', tplId);
      var existing = el.getAttribute('style')||'';
      existing = existing.replace(/\/\*PPTPL\*\/[^]*?\/\*\/PPTPL\*\//g,'');
      el.setAttribute('style', existing + '/*PPTPL*/'+styles+'/*\/PPTPL*/');
    }
    // For light-background templates the h3 inline color (#D4AF37 gold) is
    // near-invisible. Inject a <style> override so the heading is readable.
    var h3Color = TPL_H3_COLORS[tplId];
    if(h3Color){
      var styleId = 'ppTplH3Style';
      var sEl = document.getElementById(styleId);
      if(!sEl){ sEl = document.createElement('style'); sEl.id = styleId; document.head.appendChild(sEl); }
      sEl.textContent = '#sceneBanner h3 { color: ' + h3Color + ' !important; }';
    }
    if(pos && (pos.x!=null||pos.y!=null)){
      var pStyles = ';left:'+(pos.x||50)+'% !important;top:'+(pos.y||50)+'% !important;transform:translate(-50%,-50%) !important;';
      var cur = el.getAttribute('style')||'';
      cur = cur.replace(/\/\*PPPOS\*\/[^]*?\/\*\/PPPOS\*\//g,'');
      el.setAttribute('style', cur + '/*PPPOS*/'+pStyles+'/*\/PPPOS*/');
    }
  }, 60);
}

/* ─── Scene-key auto-detection from URL path ─── */
var SCENE_PATH_MAP = [
  {re:/jamarat base update 2/i,         key:'jamarat-12th'},
  {re:/Jamarat Base 2/i,                key:'jamarat-12th'},
  {re:/Jamarat rooftop basement/i,      key:'jamarat-11th'},
  {re:/Jamarat rooftop/i,               key:'jamarat-10th'},
  {re:/Jamarat Aqabah/i,                key:'jamarat-10th'},
  {re:/Muzdalifah/i,                    key:'muzdalifah-9th'},
  {re:/4 Arafah/i,                      key:'arafah-9th'},
  {re:/3 Mina/i,                        key:'mina-8th'},
  {re:/2 Safa and Marwa/i,              key:'safa-marwa'},
  {re:/qurbani-scene/i,                 key:'qurbani-10th'},
  {re:/barber-scene/i,                  key:'barber-hajj'},
  {re:/0 Ihram\/rest-scene/i,           key:'rest-umrah'},
  {re:/0 Ihram\/ihram-scene/i,          key:'reenter-ihram'},
  {re:/0 Ihram/i,                       key:'tawaf-initial'},
  {re:/1 Tawaf/i,                       key:'tawaf-initial'}
];
function detectSceneKey(){
  try{
    var path = decodeURIComponent(location.pathname);
    var ctx = (location.search.match(/[?&]context=([^&]+)/)||[])[1];
    // Also fall back to journeyState.currentContext when URL has no context (e.g., direct nav)
    if(!ctx){
      try{ var js=JSON.parse(localStorage.getItem('journeyState')||'{}'); if(js&&js.currentContext) ctx=js.currentContext; }catch(_){ }
    }
    if(/1 Tawaf/i.test(path)){
      if(ctx==='ifadha') return 'tawaf-ifadha';
      if(ctx==='farewell') return 'tawaf-farewell';
    }
    if(/3 Mina/i.test(path) && ctx==='tents-12th') return 'mina-tents-12';
    if(/2 Safa and Marwa/i.test(path) && ctx==='umrah-trim') return 'barber-umrah';
    // Dedicated step-3 file always maps to barber-umrah (Umrah trim).
    if(/umrah-trim-scene/i.test(path)) return 'barber-umrah';
    // Disambiguate barber-scene by context — step 3 (umrah-trim) vs step 11 (halaq)
    if(/barber-scene/i.test(path)){
      if(ctx==='umrah-trim') return 'barber-umrah';
      return 'barber-hajj';
    }
    for(var i=0;i<SCENE_PATH_MAP.length;i++){ if(SCENE_PATH_MAP[i].re.test(path)) return SCENE_PATH_MAP[i].key; }
  }catch(_){ }
  return null;
}

/* ═══════════════════════════════════════════════
   USER-FACING LANGUAGE SWITCHER (floating pill)
   Only shown on the welcome / landing pages — NEVER inside a scene.
   Pilgrims pick their language once at the start; on scene pages the pill
   would overlap our hamburger / HUD and is intentionally suppressed.
   ═══════════════════════════════════════════════ */
function isScenePage(){
  try{
    var p = (window.location && window.location.pathname) || '';
    p = decodeURIComponent(p).toLowerCase();
    // Every VR scene lives under /pilgrimspath-vr/pilgrims path main/...
    if(p.indexOf('/pilgrims path main/') !== -1) return true;
    if(p.indexOf('/pilgrimspath-vr/') !== -1) return true;
    // Defensive: the 3DVista player exposes a global `tour` object
    if(typeof window.tour !== 'undefined') return true;
    if(document.getElementById('viewer')) return true;
  }catch(_){}
  return false;
}
function injectLangSwitcher(){
  if(isScenePage()) return; // never on scene pages
  if(document.getElementById('ppLangSwitcher')) return;
  if(!data || !data.languages || data.languages.length<1) return;
  var css = ''+
    '#ppLangSwitcher{position:fixed;top:14px;right:14px;z-index:99999;font-family:"DM Sans",Arial,sans-serif;user-select:none}'+
    '#ppLangBtn{display:inline-flex;align-items:center;gap:6px;background:rgba(20,12,4,.85);color:#FFD98A;border:1px solid rgba(212,175,55,.55);border-radius:999px;padding:7px 14px;font-size:.78rem;font-weight:600;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 4px 14px rgba(0,0,0,.45);transition:transform .15s,border-color .15s}'+
    '#ppLangBtn:hover{border-color:#FFD98A;transform:translateY(-1px)}'+
    '#ppLangBtn .ppGlobe{font-size:.95rem}'+
    '#ppLangMenu{position:absolute;top:calc(100% + 6px);right:0;min-width:180px;background:rgba(15,18,28,.97);border:1px solid rgba(212,175,55,.45);border-radius:10px;padding:6px;box-shadow:0 12px 32px rgba(0,0,0,.55);display:none;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}'+
    '#ppLangSwitcher.open #ppLangMenu{display:block}'+
    '#ppLangMenu .ppLangItem{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;border-radius:6px;color:#f4ead5;font-size:.8rem;cursor:pointer;transition:background .12s}'+
    '#ppLangMenu .ppLangItem:hover{background:rgba(212,175,55,.14);color:#FFD98A}'+
    '#ppLangMenu .ppLangItem.active{background:rgba(212,175,55,.22);color:#FFD98A;font-weight:600}'+
    '#ppLangMenu .ppLangItem small{opacity:.55;font-size:.65rem;font-family:Monaco,monospace;margin-left:8px}'+
    '@media (max-width:600px){#ppLangSwitcher{top:10px;right:10px}#ppLangBtn{padding:6px 11px;font-size:.72rem}}';
  var st = document.createElement('style'); st.id='ppLangSwitcherCss'; st.textContent = css; document.head.appendChild(st);

  var current = langEntry(lang) || data.languages[0];
  var wrap = document.createElement('div'); wrap.id='ppLangSwitcher';
  wrap.innerHTML =
    '<button id="ppLangBtn" type="button" aria-haspopup="listbox" aria-expanded="false" title="Choose language">'+
      '<span class="ppGlobe">\uD83C\uDF10</span>'+
      '<span id="ppLangBtnLabel">'+(current.name||current.code.toUpperCase())+'</span>'+
      '<span style="opacity:.6;font-size:.65rem">\u25BE</span>'+
    '</button>'+
    '<div id="ppLangMenu" role="listbox">'+
      data.languages.map(function(L){
        return '<div class="ppLangItem'+(L.code===lang?' active':'')+'" data-code="'+L.code+'" role="option">'+
          '<span>'+(L.name||L.code)+'</span><small>'+L.code.toUpperCase()+(L.dir==='rtl'?' \u00b7 RTL':'')+'</small>'+
        '</div>';
      }).join('')+
    '</div>';
  document.body.appendChild(wrap);

  var btn = wrap.querySelector('#ppLangBtn');
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', wrap.classList.contains('open')?'true':'false');
  });
  document.addEventListener('click', function(){ wrap.classList.remove('open'); btn.setAttribute('aria-expanded','false'); });
  wrap.querySelectorAll('.ppLangItem').forEach(function(it){
    it.addEventListener('click', function(e){
      e.stopPropagation();
      var c = it.getAttribute('data-code');
      if(c===lang){ wrap.classList.remove('open'); return; }
      try{ if(window._voAudio){ window._voAudio.pause(); } }catch(_){ }
      try{ if(window._pbVORef){ window._pbVORef.pause(); } }catch(_){ }
      localStorage.setItem(LANG_KEY, c);
      location.reload();
    });
  });
}

/* ═══════════════════════════════════════════════
   BUTTON-TRIGGER AUTO-WIRING
   ═══════════════════════════════════════════════ */
function safeCssEscape(s){
  if(window.CSS && CSS.escape) return CSS.escape(s);
  return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}
// Normalize button labels for matching: strip emoji/arrows/punctuation,
// collapse whitespace, normalize curly→straight quotes, lowercase.
function normLabel(s){
  if(!s) return '';
  return String(s)
    .replace(/[\u2018\u2019\u201A\u201B]/g,"'")          // curly single → straight
    .replace(/[\u201C\u201D\u201E\u201F]/g,'"')          // curly double → straight
    .replace(/[\u2190-\u21FF\u25B6\u25C0\u25B8\u25C2\u27A1\u27A4\u2B05\u2B06\u2B07]/g,' ') // arrows
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,' ')      // emoji surrogate pairs
    .replace(/[\u2700-\u27BF]/g,' ')                     // dingbats
    .replace(/[\u2600-\u26FF]/g,' ')                     // misc symbols (incl. 🕋 area? no, that's astral)
    .replace(/[^\w\s'"-]/g,' ')                          // other non-word punct
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
}
function findButtonElement(buttonId, buttonLabel){
  if(!buttonId && !buttonLabel) return null;
  var el;
  if(buttonId){
    el = document.getElementById(buttonId);
    if(el) return el;
    try{ el = document.querySelector('[data-pp-button="'+safeCssEscape(buttonId)+'"]'); if(el) return el; }catch(_){ }
    // class match if user typed ".some-class"
    if(/^\./.test(buttonId)){
      try{ el = document.querySelector(buttonId); if(el) return el; }catch(_){ }
    }
    try{ el = document.querySelector(buttonId); if(el && (el.tagName==='BUTTON'||el.tagName==='A'||el.getAttribute('role')==='button')) return el; }catch(_){ }
  }
  // Robust label matching — normalize both sides
  var target = normLabel(buttonLabel||buttonId||'');
  if(!target) return null;
  var candidates = document.querySelectorAll('button, a[role="button"], [role="button"], .button, .btn');
  // Pass 1: exact normalized match
  for(var i=0;i<candidates.length;i++){
    if(normLabel(candidates[i].textContent||'') === target) return candidates[i];
  }
  // Pass 2: substring (target inside candidate text)
  for(var j=0;j<candidates.length;j++){
    var t = normLabel(candidates[j].textContent||'');
    if(t && t.indexOf(target)>=0) return candidates[j];
  }
  // Pass 3: substring (candidate text inside target — handles overlong target)
  for(var k=0;k<candidates.length;k++){
    var t2 = normLabel(candidates[k].textContent||'');
    if(t2 && target.indexOf(t2)>=0 && t2.length>=4) return candidates[k];
  }
  return null;
}

function ppPlayVOAuto(file){
  if(!file) return;
  // Cancel any in-flight VO + leftover chain so a new track always wins
  try{ if(window._voAudio){ window._voAudio.pause(); window._voAudio = null; } }catch(_){ }
  try{ if(window._ppFallbackVO){ window._ppFallbackVO.pause(); window._ppFallbackVO = null; } }catch(_){ }
  if(window._voChainPending && window._voChainPending !== file) window._voChainPending = null;
  if(typeof window.playVO==='function'){ try{ window.playVO(file); return; }catch(_){ } }
  try{
    var a = new Audio(audioUrl(file));
    window._ppFallbackVO = a;
    var p = a.play();
    if(p && p.catch){ p.catch(function(){
      var unlock = function(){
        document.removeEventListener('click', unlock, true);
        document.removeEventListener('touchend', unlock, true);
        a.play().catch(function(){});
      };
      document.addEventListener('click', unlock, true);
      document.addEventListener('touchend', unlock, true);
    }); }
  }catch(_){ }
}

function showAdminBanner(opts){
  var el = document.getElementById('sceneBanner');
  var freshlyCreated = false;
  if(!el){
    el = document.createElement('div');
    el.id = 'sceneBanner';
    el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.92);z-index:99000;background:#1a1a2e;color:#f4ead5;border:2px solid #D4AF37;border-radius:14px;padding:24px 32px;max-width:min(94vw,640px);font-family:Georgia,serif;box-shadow:0 18px 44px rgba(0,0,0,.55);display:none;opacity:0;transition:opacity .35s ease, transform .35s cubic-bezier(.2,.9,.3,1.2);will-change:opacity,transform';
    document.body.appendChild(el);
    freshlyCreated = true;
  }
  // Inject backdrop once (soft scrim that fades in with the banner)
  var bd = document.getElementById('sceneBannerBackdrop');
  if(!bd){
    bd = document.createElement('div');
    bd.id = 'sceneBannerBackdrop';
      bd.style.cssText = 'position:fixed;inset:0;z-index:98999;background:rgba(8,6,12,.12);opacity:0;pointer-events:none;transition:opacity .35s ease;display:none';
    document.body.appendChild(bd);
  }
  var title = opts.title||'';
  var html = opts.html||'';
  // Reset scene pager so its stale state can't re-show old banner pages
  // when this banner's "Continue" button calls window.dismissBanner().
  try{ if(window._bannerPager) window._bannerPager = {title:'', pages:[], index:0}; }catch(_){}
  el.innerHTML = '<div class="sceneBannerBody">'+(title?'<h3 style="margin:0 0 12px;color:#D4AF37">'+title+'</h3>':'')+html+
    '<div style="margin-top:14px;text-align:center"><button onclick="(function(){var e=document.getElementById(\'sceneBanner\');var b=document.getElementById(\'sceneBannerBackdrop\');if(e){e.style.opacity=\'0\';e.style.transform=\'translate(-50%,-50%) scale(.92)\';setTimeout(function(){e.style.display=\'none\';},340);}if(b){b.style.opacity=\'0\';setTimeout(function(){b.style.display=\'none\';},340);}try{if(typeof window.dismissBanner===\'function\')window.dismissBanner();}catch(_){}try{if(typeof window.__ppSceneBannerAfterClose===\'function\'){var fn=window.__ppSceneBannerAfterClose;window.__ppSceneBannerAfterClose=null;fn();}}catch(_){window.__ppSceneBannerAfterClose=null;}})()" style="background:#D4AF37;color:#1a1a2e;border:none;padding:8px 22px;border-radius:6px;font-weight:700;cursor:pointer;font-size:.85rem">Continue \u25b8</button></div>'+
    '</div>';
  // Make sure starting state is reset before showing (handles re-show case)
  el.style.display = 'block';
  bd.style.display = 'block';
  if(opts.template) applyTemplate('#sceneBanner', opts.template, opts.position||{x:50,y:50});
  // Safety override: mz-load must always use sunrise-gold regardless of what is
  // stored in localStorage (guard against stale midnight-blue template in cache).
  if(opts.id === 'mz-load' && opts.template !== 'sunrise-gold'){
    applyTemplate('#sceneBanner', 'sunrise-gold', opts.position||{x:50,y:50});
  }
  // Reset any template-injected transform so our scale animation works
  el.style.opacity = '0';
  el.style.transform = (el.style.transform.replace(/scale\([^)]*\)/,'').trim() || 'translate(-50%,-50%)') + ' scale(.92)';
  bd.style.opacity = '0';
  // Animate in on next frame
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      el.style.opacity = '1';
      el.style.transform = el.style.transform.replace(/scale\([^)]*\)/,'scale(1)');
      bd.style.opacity = '1';
    });
  });
}

function autoWireButtons(){
  var key = detectSceneKey();
  if(!key) return;
  var btns = byButton(key);
  if(!btns.length) return;
  function resumeButtonAction(el){
    if(!el || el.dataset.ppResumePending==='1') return;
    el.dataset.ppResumePending = '1';
    setTimeout(function(){
      el.dataset.ppAllowNative = '1';
      try{
        if(typeof el.click === 'function') el.click();
        else if(typeof el.onclick === 'function') el.onclick();
      }finally{
        setTimeout(function(){
          delete el.dataset.ppAllowNative;
          delete el.dataset.ppResumePending;
        }, 0);
      }
    }, 0);
  }
  btns.forEach(function(b){
    if(!b.buttonId && !b.buttonLabel) {
      console.warn('[PPContent] button banner "'+(b.id||'?')+'" has no buttonId or buttonLabel — skipping');
      return;
    }
    var el = findButtonElement(b.buttonId, b.buttonLabel);
    if(!el){
      // Only warn once per (banner,scene) load to avoid log spam from MutationObserver retries
      var k = 'pp_btn_warn_'+key+'_'+b.id;
      if(!window[k]){
        window[k] = 1;
        console.warn('[PPContent] button not found for banner "'+(b.id||'?')+'"  — buttonId="'+(b.buttonId||'')+'", buttonLabel="'+(b.buttonLabel||'')+'". Tip: add data-pp-button="'+(b.buttonId||b.buttonLabel||'')+'" to your <button> element, or check the spelling.');
      }
      return;
    }
    if(el.dataset.ppBound==='1') return;
    el.dataset.ppBound = '1';
    console.log('[PPContent] wired button: "'+(el.textContent||'').trim().slice(0,40)+'" → '+(b.audio||'(no audio)')+(b.audioChain?' → '+b.audioChain:''));
    el.addEventListener('click', function(e){
      if(el.dataset.ppAllowNative==='1') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      // Suppress the first-interaction welcome VO so admin's button audio wins cleanly
      window._welcomeVoStarted = true;
      var resume = function(){ resumeButtonAction(el); };
      if(b.audio){ ppPlayVOAuto(b.audio); if(b.audioChain) window._voChainPending = b.audioChain; }
      if(b.title || b.html){
        window.__ppSceneBannerAfterClose = resume;
        showAdminBanner({title:b.title, html:b.html, template:b.template, position:b.position});
        return;
      }
      resume();
    }, true);
  });
}

/* ═══════════════════════════════════════════════
   COMPLETION BANNER WRAPPER
   ═══════════════════════════════════════════════ */
function wrapCompletionTrigger(){
  var orig = window.showJourneyNextButton;
  if(!orig || orig.__ppWrapped) return;
  var wrapped = function(){
    try{
      var completionReady = window.journeyActivityComplete === true || window.journeyIsLastPanorama === true;
      if(completionReady && !wrapped.__fired){
        wrapped.__fired = true;
        var key = detectSceneKey();
        var comp = key && byCompletion(key);
        if(comp){
          if(comp.audio){ ppPlayVOAuto(comp.audio); }
          if(comp.title || comp.html){
            var html = comp.html || '';
            html += '<p style="margin-top:14px;font-size:.85rem;color:#FFD98A;text-align:center;font-style:italic">\u270e Tap <strong>Continue</strong>, then use the <strong>Next Stop \u2192</strong> button to proceed.</p>';
            showAdminBanner({title:comp.title, html:html, template:comp.template, position:comp.position});
          }
        }
      }
    }catch(e){ console.warn('[PPContent] completion banner failed', e); }
    return orig.apply(this, arguments);
  };
  wrapped.__ppWrapped = true;
  window.showJourneyNextButton = wrapped;
}

function waitForCompletionHook(){
  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    if(typeof window.showJourneyNextButton === 'function'){
      wrapCompletionTrigger();
      clearInterval(iv);
    } else if(tries>40){ clearInterval(iv); }
  }, 250);
}

/* ═══════════════════════════════════════════════
   FIRST-INTERACTION UNLOCK
   Browsers block autoplay until the user interacts with the page.
   On the first click/tap/keypress anywhere, fire the scene's primary VO
   (welcome / first guide screen). After this, all subsequent VOs work.
   This means the VO begins on the user's first action — typically the
   "Let's Begin" button — without any extra UI.
   ═══════════════════════════════════════════════ */
function getCurrentSceneVO(){
  var key = detectSceneKey();
  if(!key) return null;
  var s = getScene(key);
  if(!s || !s.banners || !s.banners.length) return null;
  var guide = s.banners.find(function(b){return /^guide-screen-/.test(b.trigger||'') && audioFile(b);});
  if(guide) return { audio:audioFile(guide), chain:audioChainFile(guide) };
  var any = s.banners.find(function(b){return audioFile(b);});
  if(any) return { audio:audioFile(any), chain:audioChainFile(any) };
  return null;
}
function installFirstInteractionVO(){
  if(window._ppFirstVOArmed) return;
  window._ppFirstVOArmed = true;
  var fired = false;
  var fire = function(){
    if(fired) return; fired = true;
    document.removeEventListener('click', fire, true);
    document.removeEventListener('touchend', fire, true);
    document.removeEventListener('keydown', fire, true);
    document.removeEventListener('pointerdown', fire, true);
    // If the scene's own VO is already playing (e.g. "Let's Begin" handler
    // started it), don't double-fire.
    if(window._voAudio && !window._voAudio.paused) return;
    if(window._welcomeVoStarted) return;
    // Don't override Ihram-guide step VOs — the guide has its own VO system
    // and we must not cancel it by playing a panorama VO on the same click.
    var guide = document.getElementById('ihramGuide');
    if(guide && guide.style.display !== 'none' && !guide.classList.contains('hidden')) return;
    var v = getCurrentSceneVO();
    if(!v || !v.audio) return;
    if(v.chain) window._voChainPending = v.chain;
    ppPlayVOAuto(v.audio);
  };
  document.addEventListener('click', fire, true);
  document.addEventListener('touchend', fire, true);
  document.addEventListener('keydown', fire, true);
  document.addEventListener('pointerdown', fire, true);
}

/* ═══════════════════════════════════════════════
   SCENE-LOAD AUTOPLAY
   For non-VR scenes (barber-scene, qurbani-scene, rest, re-enter Ihram,
   Muzdalifah briefing, etc.) — banners with trigger='scene-load' fire
   their banner + VO immediately on page load. We attempt autoplay; if the
   browser blocks it (no prior interaction), the existing first-interaction
   VO handler will pick it up on the next click anywhere.
   ═══════════════════════════════════════════════ */
function getSceneLoadBanner(){
  var key = detectSceneKey();
  if(!key) return null;
  var s = getScene(key);
  if(!s || !s.banners) return null;
  return s.banners.find(function(b){return b.trigger==='scene-load';}) || null;
}
function fireSceneLoad(){
  if(window._ppSceneLoadFired) return;
  var b = getSceneLoadBanner();
  if(!b) return;
  window._ppSceneLoadFired = true;
  var t = textFor(b)||{};
  var audio = audioFile(b);
  // Show banner with smooth transition
  if(t.title || t.body){
    showAdminBanner({title:t.title||'', html:t.body||'', template:b.template, position:b.position});
  }
  if(audio){
    // Mark so first-interaction handler doesn't fire again
    window._welcomeVoStarted = true;
    ppPlayVOAuto(audio);
  }
}

/* ─── DOM-ready bootstrap ─── */
function boot(){
  injectLangSwitcher();
  // Try scene-load FIRST so its banner+VO appears immediately. If autoplay
  // is blocked the first-interaction handler is still armed as a fallback.
  fireSceneLoad();
  installFirstInteractionVO();
  autoWireButtons();
  try{
    var mo = new MutationObserver(function(){
      if(boot._t) return;
      boot._t = setTimeout(function(){ boot._t=null; autoWireButtons(); }, 400);
    });
    mo.observe(document.body, {childList:true, subtree:true});
  }catch(_){ }
  waitForCompletionHook();
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', boot);
} else { boot(); }

/* ─── Public API ─── */
window.PPContent = {
  lang: lang,
  hasData: !!data,
  getScene: getScene,
  audioMapByPano: audioMapByPano,
  audioChainMapByPano: audioChainMapByPano,
  bannerMapByPano: bannerMapByPano,
  byId: byId,
  bySequence: bySequence,
  byButton: byButton,
  byCompletion: byCompletion,
  audioUrl: audioUrl,
  applyTemplate: applyTemplate,
  detectSceneKey: detectSceneKey,
  showCompletionBanner: function(sceneKey){
    var k = sceneKey || detectSceneKey();
    var comp = k && byCompletion(k);
    if(!comp) return false;
    if(comp.audio) ppPlayVOAuto(comp.audio);
    if(comp.title || comp.html) showAdminBanner({title:comp.title, html:comp.html, template:comp.template, position:comp.position});
    return true;
  },
  setLang: function(l){ localStorage.setItem(LANG_KEY,l); location.reload(); }
};

window.addEventListener('storage', function(e){
  if(e.key===KEY || e.key===LANG_KEY){
    if(window._voAudio){ try{window._voAudio.pause();}catch(_){} }
    location.reload();
  }
});

/* ─── Banner CSS — universally applied (no media-query) ─────────────────
   VR scene pages have no <meta viewport> tag so any @media width query
   would never fire on phones (browser defaults to 980px layout width).
   Solution: always use the clean CSS card — it looks great on every
   screen size and is far more professional than the distorted PNG frame. */
(function(){
  var s = document.createElement('style');
  s.textContent =
    /* ── Banner shell: cream card, gold border ── */
    '#sceneBanner{'
    + 'width:min(90vw,860px)!important;'
    + 'min-height:auto!important;'
    + 'max-height:88vh!important;'
    + 'background:rgba(255,252,242,0.98)!important;'
    + 'border-radius:18px!important;'
    + 'border:1.5px solid rgba(201,168,76,0.50)!important;'
    + 'box-shadow:0 0 0 5px rgba(201,168,76,0.10),0 24px 64px rgba(0,0,0,0.52)!important;'
    + 'overflow:hidden!important;'
    + 'position:fixed!important;top:50%!important;left:50%!important;'
    + 'transform:translate(-50%,-50%)!important;'
    + '}'
    /* Gold accent stripe top */
    + '#sceneBanner::before{'
    + 'content:""!important;display:block!important;'
    + 'position:absolute!important;top:0!important;left:0!important;right:0!important;height:4px!important;'
    + 'background:linear-gradient(90deg,transparent,#C9A84C 25%,#8B6914 50%,#C9A84C 75%,transparent)!important;'
    + 'border-radius:18px 18px 0 0!important;pointer-events:none!important;'
    + '}'
    /* ── Body ── */
    + '#sceneBanner .sceneBannerBody{'
    + 'box-sizing:border-box!important;width:100%!important;'
    + 'padding:clamp(28px,4.5vh,54px) clamp(22px,7vw,90px) clamp(22px,3.5vh,40px)!important;'
    + 'max-height:88vh!important;overflow-y:auto!important;overflow-x:hidden!important;'
    + 'display:flex!important;flex-direction:column!important;'
    + 'justify-content:flex-start!important;align-items:center!important;'
    + 'scrollbar-width:thin!important;scrollbar-color:rgba(201,168,76,0.3) transparent!important;'
    + '}'
    + '#sceneBanner .sceneBannerBody>*{width:100%!important;text-align:center!important;}'
    + '#sceneBanner .sceneBannerBody>button{width:auto!important;align-self:center!important;display:inline-flex!important;}'
    /* ── Typography ── */
    + '#sceneBanner h3{'
    + 'font-size:clamp(17px,2.8vw,30px)!important;margin:0 0 14px!important;'
    + 'line-height:1.25!important;color:#8B6914!important;font-weight:700!important;text-align:center!important;'
    + '}'
    + '#sceneBanner .bb{'
    + 'font-size:clamp(13px,1.35vw,17px)!important;line-height:1.65!important;'
    + 'margin:0 0 10px!important;color:#3D2B1F!important;text-align:center!important;'
    + '}'
    + '#sceneBanner .ba{'
    + 'font-size:clamp(14px,1.55vw,20px)!important;line-height:1.65!important;'
    + 'margin:8px 0 6px!important;color:#8B6914!important;font-style:italic!important;text-align:center!important;'
    + '}'
    + '#sceneBanner .bt{'
    + 'font-size:clamp(12px,1.15vw,16px)!important;line-height:1.55!important;'
    + 'margin:0 0 10px!important;color:#6B5B4F!important;font-style:italic!important;text-align:center!important;'
    + '}'
    + '#sceneBanner .sep{width:64px!important;margin:10px auto!important;}'
    /* ── Button ── */
    + '#sceneBanner button{'
    + 'padding:clamp(10px,1.2vh,14px) clamp(22px,3vw,34px)!important;'
    + 'font-size:clamp(13px,1.1vw,15px)!important;'
    + 'margin-top:clamp(12px,2vh,18px)!important;border-radius:8px!important;min-width:110px!important;'
    + '}';
  document.head
    ? document.head.appendChild(s)
    : document.addEventListener('DOMContentLoaded', function(){ document.head.appendChild(s); });
})();

})();
