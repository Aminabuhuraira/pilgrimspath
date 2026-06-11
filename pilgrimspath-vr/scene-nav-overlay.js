/**
 * Scene Navigation Overlay — 18-step full journey strip
 * Each page must set window._sceneNavBase and window._sceneNavCurrent before loading this script.
 *
 * _sceneNavBase    : relative path from current page to "pilgrims path main/" folder
 * _sceneNavCurrent : id string of the current scene (fallback when no ?journey= param)
 * Active step is detected from URL ?journey=N first, then _sceneNavCurrent.
 */
(function () {
  var BASE = (window._sceneNavBase || '../').replace(/\/$/,'/');
  var CURRENT = window._sceneNavCurrent || '';
  var PAGE_JOURNEY = parseInt(new URL(window.location.href).searchParams.get('journey') || '0', 10);

  var B5 = BASE + '5%20Rami%20Jamarat%2C%20Qurbani%2C%20trim%20Shave%2C%20Tawaf/';

  var SCENES = [
    { step:1,  id:'tawaf',         emoji:'🕋',  name:'Tawaf',     colors:['#8B6914','#4A3308'], path: BASE + '1%20Tawaf/index.htm?context=initial' },
    { step:2,  id:'safa',          emoji:'🚶',  name:"Sa\u02bfi", colors:['#1D6497','#0A3258'], path: BASE + '2%20Safa%20and%20Marwa/index.htm' },
    { step:3,  id:'barber-umrah',  emoji:'✂️', name:'Trim',      colors:['#15803d','#0f5132'], path: B5 + 'umrah-trim-scene.html?context=umrah-trim' },
    { step:4,  id:'rest',          emoji:'🌙',  name:'Rest',      colors:['#1E3A5F','#0D2240'], path: BASE + '0%20Ihram/rest-scene.html' },
    { step:5,  id:'ihram-reenter', emoji:'🤲',  name:'Re-Ihram',  colors:['#C9A227','#8B6914'], path: BASE + '0%20Ihram/ihram-scene.html?context=re-enter' },
    { step:6,  id:'mina-8th',      emoji:'⛺',  name:'Mina 8',   colors:['#15683A','#083D22'], path: BASE + '3%20Mina/index.htm?context=8th-day' },
    { step:7,  id:'arafah',        emoji:'🌄',  name:'Arafah',   colors:['#6D28D9','#3B1580'], path: BASE + '4%20Arafah/index.htm' },
    { step:8,  id:'muzdalifah',    emoji:'⭐',  name:'Muzdalifa',colors:['#0E4D6E','#07293C'], path: BASE + 'Muzdalifah/index.htm' },
    { step:9,  id:'jamarat-10th',  emoji:'🪨',  name:'Aqabah',   colors:['#991B1B','#510E0E'], path: BASE + 'Jamarat%20Aqabah/index.htm?context=10th-day' },
    { step:10, id:'qurbani',       emoji:'🐑',  name:'Qurbani',  colors:['#A0522D','#5B2D14'], path: B5 + 'qurbani-scene.html' },
    { step:11, id:'barber',        emoji:'✂️', name:'Halaq',    colors:['#374151','#1F2937'], path: B5 + 'barber-scene.html?context=barber' },
    { step:12, id:'tawaf-ifadha',  emoji:'🕋',  name:'Ifadha',   colors:['#8B6914','#4A3308'], path: BASE + '1%20Tawaf/index.htm?context=ifadha' },
    { step:13, id:'jamarat-11th',  emoji:'🪨',  name:'Day 11',   colors:['#991B1B','#510E0E'], path: B5 + 'Jamarat%20rooftop/index.htm?context=11th-day' },
    { step:14, id:'mina-12th',     emoji:'⛺',  name:'Night 12', colors:['#15683A','#083D22'], path: BASE + '3%20Mina/index.htm?context=tents-12th' },
    { step:15, id:'jamarat-12th',  emoji:'🪨',  name:'Day 12',   colors:['#991B1B','#510E0E'], path: BASE + 'jamarat%20base%20update%202/index.htm?context=12th-day&v=15' },
    { step:16, id:'farewell',      emoji:'🕌',  name:'Farewell', colors:['#8B6914','#4A3308'], path: BASE + '1%20Tawaf/index.htm?context=farewell' }
  ];

  // Day bucket mapping — mirrors admin-journey-content.js dayBucketFor()
  // Pre-Hajj/Umrah: 1-5 | Day 8 Tarwiyah: 6 | Day 9 Arafah & Muzdalifah: 7-8
  // Day 10 Yawm an-Nahr: 9-12 | Day 11 Tashreeq: 13 | Day 12 Tashreeq: 14-15 | Final: 16
  function dayBucketFor(step){
    if(step <= 5)  return { key:'umrah',  label:'Umrah' };
    if(step === 6) return { key:'day8',   label:'Day 8' };
    if(step <= 8)  return { key:'day9',   label:'Day 9' };
    if(step <= 12) return { key:'day10',  label:'Day 10' };
    if(step === 13)return { key:'day11',  label:'Day 11' };
    if(step <= 15) return { key:'day12',  label:'Day 12' };
    return            { key:'final',  label:'Wida\u02bc' };
  }

  function build() {
    var css = [
      /* outer rail */
      '#scnRail{position:fixed;left:0;right:0;bottom:0;z-index:10010;',
        'pointer-events:none;display:flex;justify-content:center;padding:0 8px 6px;}',
      /* inner pill */
      '#scnRailInner{pointer-events:auto;display:flex;gap:8px;align-items:flex-end;',
        'padding:4px 10px 5px;max-width:100%;overflow-x:auto;overflow-y:hidden;',
        'background:linear-gradient(180deg,rgba(18,10,3,0.0),rgba(14,8,2,0.85));',
        'border-radius:18px 18px 0 0;backdrop-filter:blur(6px);',
        'scrollbar-width:none;-ms-overflow-style:none;}',
      '#scnRailInner::-webkit-scrollbar{display:none;}',
      /* day-cluster group */
      '.scnGroup{flex:0 0 auto;display:flex;flex-direction:column;align-items:stretch;gap:0;}',
      '.scnGroupLabel{font-family:"DM Sans",Arial,sans-serif;font-size:8.5px;font-weight:700;',
        'letter-spacing:0.6px;text-transform:uppercase;color:#C9A84C;text-align:center;',
        'padding:1px 6px 2px;line-height:1;opacity:0.85;}',
      '@media(min-width:520px){.scnGroupLabel{font-size:9.5px;}}',
      /* sideways "}" bracket — top edge with rounded outer corners + center notch */
      '.scnGroupBracket{position:relative;height:8px;margin:0 4px 2px;',
        'border-top:1.5px solid rgba(201,168,76,0.55);',
        'border-left:1.5px solid rgba(201,168,76,0.55);',
        'border-right:1.5px solid rgba(201,168,76,0.55);',
        'border-radius:8px 8px 0 0;}',
      '.scnGroupBracket::before{content:"";position:absolute;top:-1.5px;left:50%;width:10px;',
        'height:6px;transform:translate(-50%,-100%);',
        'border-bottom:1.5px solid rgba(201,168,76,0.55);',
        'border-left:1.5px solid rgba(201,168,76,0.55);',
        'border-right:1.5px solid rgba(201,168,76,0.55);',
        'border-radius:0 0 6px 6px;background:transparent;}',
      '.scnGroupItems{display:flex;gap:4px;align-items:flex-start;}',
      '.scnGroup.scnGroupActive .scnGroupLabel{color:#FFD98A;opacity:1;}',
      '.scnGroup.scnGroupActive .scnGroupBracket,',
      '.scnGroup.scnGroupActive .scnGroupBracket::before{border-color:#FFD98A;}',
      /* item */
      '.scnItem{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;',
        'gap:2px;text-decoration:none;cursor:pointer;padding:3px 4px;border-radius:12px;',
        'transition:transform .12s,background .12s;}',
      '.scnItem:hover{background:rgba(201,168,76,0.14);transform:translateY(-2px);}',
      /* circle wrapper (relative for badge) */
      '.scnCircleWrap{position:relative;width:36px;height:36px;}',
      '@media(min-width:520px){.scnCircleWrap{width:42px;height:42px;}}',
      /* circle */
      '.scnCircle{width:100%;height:100%;border-radius:50%;display:flex;align-items:center;',
        'justify-content:center;font-size:17px;line-height:1;',
        'border:1.5px solid rgba(255,255,255,0.12);',
        'box-shadow:0 2px 8px rgba(0,0,0,0.4);',
        'transition:transform .15s,box-shadow .15s,border-color .15s;}',
      '@media(min-width:520px){.scnCircle{font-size:19px;}}',
      '.scnItem:hover .scnCircle{transform:scale(1.08);box-shadow:0 3px 12px rgba(201,168,76,0.5);}',
      '.scnCircle.scnActive{border:2px solid #C9A84C;',
        'box-shadow:0 0 0 2px rgba(201,168,76,0.25),0 2px 8px rgba(201,168,76,0.4);}',
      '.scnCircle.scnDone{opacity:0.55;filter:grayscale(0.3);}',
      /* step number badge */
      '.scnBadge{position:absolute;top:-3px;right:-3px;min-width:14px;height:14px;',
        'border-radius:7px;background:#C9A84C;color:#fff;font-size:8px;font-weight:700;',
        'font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;',
        'padding:0 2px;border:1px solid rgba(0,0,0,0.3);line-height:1;}',
      '.scnItem.scnActiveItem .scnBadge{background:#FFD700;color:#1a1a2e;}',
      '.scnItem.scnDoneItem .scnBadge{background:#22c55e;}',
      /* label */
      '.scnItemName{color:#E8D5A8;font-family:"DM Sans",Arial,sans-serif;',
        'font-size:9px;font-weight:600;text-align:center;line-height:1.1;',
        'max-width:44px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
        'letter-spacing:0.1px;}',
      '@media(min-width:520px){.scnItemName{font-size:10px;max-width:50px;}}',
      '.scnItem.scnActiveItem .scnItemName{color:#FFD98A;}',
      '.scnItem.scnDoneItem .scnItemName{color:#86efac;}',
      /* push other bottom-anchored UI up so they do not collide with the rail */
      '#muzdHud,#muzdPouch{bottom:88px !important;}',
      /* pebbleHUD — no desktop override; scene already sets top:74px right:16px (below pause btn) */
      /* 2D scene-card pages: ensure card does not scroll under the rail (~110px on desktop) */
      '.scene-wrap{padding-bottom:130px !important;}',
      '.scene-card{max-height:calc(100dvh - 144px) !important;}',
      /* Scene-specific action buttons must clear the rail (~80px tall on desktop) */
      '#jamarThrowBtn,#minaContinue{bottom:90px !important;}',
      '#jamarAimHint{bottom:calc(90px + 54px) !important;}',  /* aim hint above throw btn */
      /* Push path-cue toast above the throw button so it is never obscured */
      'body:has(#jamarThrowBtn) #pathCueToast{bottom:150px !important;}',
      'body:has(#minaContinue) #pathCueToast{bottom:150px !important;}',
      /* Next Stop button on desktop must clear the scene rail (~100px tall) */
      '@media(min-width:769px){#nextStopBtn{bottom:140px !important;}}',
      /* On mobile (≤768px) journey-nav.js already sets 168px which clears the rail */
      /* ===== Mobile: bottom rail stays at bottom — compact items, horizontal scroll ===== */
      '@media(max-width:640px){',
        '#scnRailInner{gap:4px;padding:4px 6px 5px;}',
        '.scnGroupLabel{font-size:9px;}',
        /* reset bracket back to horizontal-top (undo any previous vertical override) */
        '.scnGroupBracket{height:8px;width:auto;align-self:unset;margin:0 4px 2px;',
          'min-height:unset;border-bottom:none;',
          'border-top:1.5px solid rgba(201,168,76,0.55);',
          'border-left:1.5px solid rgba(201,168,76,0.55);',
          'border-right:1.5px solid rgba(201,168,76,0.55);',
          'border-radius:8px 8px 0 0;}',
        '.scnGroupBracket::before{display:block;}',
        '.scnGroupItems{flex-direction:row;gap:4px;align-items:flex-start;width:auto;}',
        '.scnItem{padding:3px 3px;}',
        '.scnCircleWrap{width:70px;height:70px;}',
      '.scnCircle{font-size:32px;}',
      '.scnBadge{min-width:26px;height:26px;font-size:13px;border-radius:14px;}',
      '.scnItemName{font-size:13px;max-width:72px;}'
        '.scnGroup{gap:2px;}',
        '#scnRailInner{gap:5px;}',
        /* HUDs stay above the bottom rail */
        '#muzdHud,#muzdPouch{left:auto !important;right:14px !important;transform:none !important;}',
        /* pebbleHUD on mobile — top-right below pause button, respect safe-area notch */
        '#pebbleHUD{top:calc(env(safe-area-inset-top,0px) + 74px) !important;right:16px !important;bottom:auto !important;}',  
        /* On mobile, action buttons need extra clearance for safe area + taller rail */
        '#jamarThrowBtn,#minaContinue{bottom:calc(90px + env(safe-area-inset-bottom,0px)) !important;}',
        '#jamarAimHint{bottom:calc(146px + env(safe-area-inset-bottom,0px)) !important;}',
        /* Mobile: ensure toast clears the action button + safe area */
        'body:has(#jamarThrowBtn) #pathCueToast,body:has(#minaContinue) #pathCueToast{bottom:calc(150px + env(safe-area-inset-bottom,0px)) !important;}',
        /* add safe-area-inset-bottom to rail inner so content isn\'t hidden under home bar */
        '#scnRailInner{padding-bottom:calc(5px + env(safe-area-inset-bottom,0px)) !important;}',
        'body.ppOverlayActive #scnRail,.ppOverlayActive #scnRail{display:none !important;opacity:0 !important;pointer-events:none !important;}',
      '}'
    ].join('');

    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    var rail = document.createElement('div');
    rail.id = 'scnRail';
    var inner = document.createElement('div');
    inner.id = 'scnRailInner';
    rail.appendChild(inner);

    var currentBucketKey = null;
    var currentGroup = null;
    var currentGroupItems = null;

    // Read persisted completion state from journey-manager (localStorage).
    // Falls back to "all steps before current URL ?journey=N" if no state yet.
    var COMPLETED = (function(){
      try{
        var raw = localStorage.getItem('journeyState');
        if(!raw) return null;
        var arr = (JSON.parse(raw)||{}).completedSteps;
        return Array.isArray(arr) ? arr : null;
      }catch(_){ return null; }
    })();

    SCENES.forEach(function (s) {
      // Active: prefer journey param, fall back to string id match
      var isActive = PAGE_JOURNEY > 0 ? (s.step === PAGE_JOURNEY) : (s.id === CURRENT);
      // Done: prefer persisted completedSteps (true completion), else legacy
      // "step is earlier in the URL-implied progression" heuristic.
      var isDone   = COMPLETED
        ? (COMPLETED.indexOf(s.step) !== -1)
        : (PAGE_JOURNEY > 0 ? (s.step < PAGE_JOURNEY) : false);

      var a = document.createElement('a');
      a.className = 'scnItem' + (isActive ? ' scnActiveItem' : '') + (isDone ? ' scnDoneItem' : '');
      // Append journey=<step> so the destination scene sets its currentStep
      // correctly (matters for Tawaf which is reused at steps 1, 12 and 16 —
      // each Tawaf-leg must drive its own state independently).
      var _sep = s.path.indexOf('?')>=0 ? '&' : '?';
      a.href = s.path + _sep + 'journey=' + s.step;
      a.title = 'Step ' + s.step + ': ' + s.name;
      a.setAttribute('aria-label', s.name);

      var wrap = document.createElement('div');
      wrap.className = 'scnCircleWrap';

      var circle = document.createElement('div');
      circle.className = 'scnCircle' + (isActive ? ' scnActive' : '') + (isDone ? ' scnDone' : '');
      circle.style.background = 'linear-gradient(145deg,' + s.colors[0] + ',' + s.colors[1] + ')';
      circle.textContent = s.emoji;

      var badge = document.createElement('span');
      badge.className = 'scnBadge';
      badge.textContent = s.step;

      wrap.appendChild(circle);
      wrap.appendChild(badge);

      var nameEl = document.createElement('span');
      nameEl.className = 'scnItemName';
      nameEl.textContent = s.name;

      a.appendChild(wrap);
      a.appendChild(nameEl);

      // Day-cluster: open a new group when bucket changes
      var bucket = dayBucketFor(s.step);
      if(bucket.key !== currentBucketKey){
        currentGroup = document.createElement('div');
        currentGroup.className = 'scnGroup';
        currentGroup.setAttribute('data-bucket', bucket.key);

        var label = document.createElement('div');
        label.className = 'scnGroupLabel';
        label.textContent = bucket.label;

        var bracket = document.createElement('div');
        bracket.className = 'scnGroupBracket';

        var items = document.createElement('div');
        items.className = 'scnGroupItems';

        currentGroup.appendChild(label);
        currentGroup.appendChild(bracket);
        currentGroup.appendChild(items);
        inner.appendChild(currentGroup);

        currentBucketKey = bucket.key;
        currentGroupItems = items;
      }
      if(isActive) currentGroup.classList.add('scnGroupActive');
      currentGroupItems.appendChild(a);
    });

    (document.getElementById('viewer') || document.body).appendChild(rail);

    // Scroll active icon into view after a short delay (strip may not be in full layout yet)
    setTimeout(function(){
      var activeEl = inner.querySelector('.scnActiveItem');
      if(activeEl){ activeEl.scrollIntoView({inline:'center', block:'nearest', behavior:'smooth'}); }
    }, 400);
  }

  if (document.body) {
    build();
  } else {
    document.addEventListener('DOMContentLoaded', build);
  }
})();
