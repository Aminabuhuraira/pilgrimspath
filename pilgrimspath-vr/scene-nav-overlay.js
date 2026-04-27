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
    { step:3,  id:'barber-umrah',  emoji:'✂️', name:'Trim',      colors:['#475569','#1F2937'], path: B5 + 'barber-scene.html?context=umrah-trim' },
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
    { step:15, id:'jamarat-12th',  emoji:'🪨',  name:'Day 12',   colors:['#991B1B','#510E0E'], path: BASE + 'Jamarat%20Base%202/index.htm?context=12th-day&v=10' },
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
      '#saiCounter,#muzdHud,#muzdPouch{bottom:80px !important;}',
      /* ===== Mobile: scene strip moves to LEFT side, vertical & scrollable ===== */
      '@media(max-width:640px){',
        /* slim left rail with fixed width so other UI can offset reliably */
        '#scnRail{left:0;right:auto;top:60px;bottom:70px;width:54px;padding:0;',
          'justify-content:flex-start;align-items:stretch;}',
        '#scnRailInner{flex-direction:column;align-items:center;gap:6px;',
          'padding:6px 3px 8px;width:54px;max-height:100%;',
          'overflow-y:auto;overflow-x:hidden;',
          'border-radius:0 16px 16px 0;',
          'background:linear-gradient(90deg,rgba(14,8,2,0.85),rgba(18,10,3,0.0));}',
        '.scnGroup{flex-direction:column;align-items:center;width:100%;}',
        '.scnGroupLabel{font-size:8px;padding:1px 2px 2px;writing-mode:horizontal-tb;}',
        /* convert bracket from horizontal-top to vertical-left */
        '.scnGroupBracket{height:auto;width:6px;align-self:center;margin:1px 0 2px;',
          'min-height:8px;border:none;border-left:1.5px solid rgba(201,168,76,0.55);',
          'border-radius:0;}',
        '.scnGroupBracket::before{display:none;}',
        '.scnGroupItems{flex-direction:column;gap:4px;align-items:center;width:100%;}',
        '.scnItem{padding:2px 2px;}',
        '.scnCircleWrap{width:32px;height:32px;}',
        '.scnCircle{font-size:15px;}',
        '.scnItemName{font-size:8px;max-width:48px;}',
        /* keep bottom-anchored HUDs out of the way of the now-narrow rail */
        '#saiCounter,#muzdHud,#muzdPouch{bottom:20px !important;left:auto !important;right:14px !important;transform:none !important;}',
        /* ===== shift center/edge-anchored UI to clear the 54px left rail ===== */
        /* center-anchored HUD/banners: nudge right by half the rail width */
        '#tawafCounter{left:calc(50% + 27px) !important;}',
        '#sceneBanner{left:calc(50% + 27px) !important;width:min(92vw,560px) !important;max-width:calc(100vw - 64px) !important;}',
        '#pathCueToast{left:calc(50% + 27px);max-width:calc(100vw - 80px);}',
        /* pause button stays top-right and next stop button stays bottom-right - both already clear of the 54px left rail */
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

    SCENES.forEach(function (s) {
      // Active: prefer journey param, fall back to string id match
      var isActive = PAGE_JOURNEY > 0 ? (s.step === PAGE_JOURNEY) : (s.id === CURRENT);
      var isDone   = PAGE_JOURNEY > 0 ? (s.step < PAGE_JOURNEY) : false;

      var a = document.createElement('a');
      a.className = 'scnItem' + (isActive ? ' scnActiveItem' : '') + (isDone ? ' scnDoneItem' : '');
      a.href = s.path;
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

    document.body.appendChild(rail);

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
