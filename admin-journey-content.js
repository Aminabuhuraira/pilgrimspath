/* ═══════════════════════════════════════════════════════════════════
   PILGRIM'S PATH — Journey Content Manager (v3)
   ▸ Full banner content mirrored from live VR scenes
   ▸ Banner template library (10 professional styles)
   ▸ Drag-to-position live preview
   ▸ Panorama overview with banner placement markers
   ▸ Multi-language editor with localStorage cross-tab sync
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var STORAGE_KEY = 'pp_journey_content_v1';
var AUDIO_BASE  = '/Hajj%20Voice%20Over/';
var SEED_VERSION = 4; // bump to force re-sync of banner text/audio from DEFAULT_DATA

/* ═══════════════════════════════════════════════
   BANNER TEMPLATE LIBRARY
   Each template defines:
   - id, name, category, sample dimensions
   - css (string injected into preview/scene scope)
   - render(title, body) → HTML
   ═══════════════════════════════════════════════ */
var BANNER_TEMPLATES = {
  'classic-gold': {
    name: 'Classic Gold Frame',
    category: 'panorama',
    desc: 'Original parchment-style banner with gold border (default Tawaf/Mina/Jamarat)',
    size: 'large',
    css: '.tpl-classic-gold{background:linear-gradient(135deg,#f5e9c8,#ede0b8);border:3px double #C9A84C;border-radius:14px;padding:32px 44px;color:#2C1810;text-align:center;font-family:"DM Sans",Arial,sans-serif;box-shadow:0 12px 36px rgba(0,0,0,.45),inset 0 0 0 1px rgba(139,105,20,.3);max-width:620px;position:relative}.tpl-classic-gold::before{content:"";position:absolute;inset:8px;border:1px solid rgba(139,105,20,.35);border-radius:8px;pointer-events:none}.tpl-classic-gold h3{color:#8B6914;font-size:1.5rem;margin:0 0 12px;font-weight:700}.tpl-classic-gold .bb{color:#3D2B1F;font-size:.95rem;line-height:1.55;margin:0 0 8px}.tpl-classic-gold .ba{color:#8B6914;font-style:italic;font-size:1.05rem;margin:8px 0 4px;line-height:1.45}.tpl-classic-gold .bt{color:#6B5B4F;font-style:italic;font-size:.85rem;margin:0 0 8px;line-height:1.4}.tpl-classic-gold .sep{width:72px;height:2px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:14px auto}'
  },
  'parchment-frame': {
    name: 'Aged Parchment',
    category: 'panorama',
    desc: 'Vintage scroll look with torn edges feel',
    size: 'large',
    css: '.tpl-parchment-frame{background:radial-gradient(ellipse at center,#f7ecd0 0%,#e8d8a8 70%,#d4be7d 100%);border-radius:6px;padding:36px 48px;color:#3a2410;text-align:center;font-family:Georgia,serif;box-shadow:0 16px 40px rgba(0,0,0,.5),inset 0 0 80px rgba(160,110,40,.18);max-width:600px;position:relative;clip-path:polygon(2% 0,98% 1%,100% 50%,99% 99%,1% 98%,0 50%)}.tpl-parchment-frame h3{color:#7a4a14;font-size:1.55rem;margin:0 0 14px;font-family:"Amiri",Georgia,serif;font-weight:700}.tpl-parchment-frame .bb{color:#3a2410;font-size:.95rem;line-height:1.6;margin:0 0 8px}.tpl-parchment-frame .ba{color:#7a4a14;font-style:italic;font-size:1.1rem;margin:10px 0;line-height:1.5}.tpl-parchment-frame .bt{color:#5a4030;font-style:italic;font-size:.85rem;margin:0 0 8px}.tpl-parchment-frame .sep{width:60%;height:1px;background:#9a6a2a;margin:14px auto;opacity:.4}'
  },
  'minimal-glass': {
    name: 'Minimal Glass',
    category: 'panorama',
    desc: 'Frosted glass card, modern and unobtrusive',
    size: 'medium',
    css: '.tpl-minimal-glass{background:rgba(255,255,255,.12);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.25);border-radius:18px;padding:24px 30px;color:#fff;text-align:center;font-family:"Poppins",sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.35);max-width:480px}.tpl-minimal-glass h3{color:#FFD98A;font-size:1.25rem;margin:0 0 10px;font-weight:600;letter-spacing:.3px}.tpl-minimal-glass .bb{color:rgba(255,255,255,.92);font-size:.88rem;line-height:1.55;margin:0 0 6px}.tpl-minimal-glass .ba{color:#FFD98A;font-style:italic;font-size:.98rem;margin:8px 0 4px}.tpl-minimal-glass .bt{color:rgba(255,255,255,.7);font-style:italic;font-size:.8rem}.tpl-minimal-glass .sep{width:40px;height:1px;background:rgba(255,217,138,.5);margin:12px auto}'
  },
  'ornate-arabesque': {
    name: 'Ornate Arabesque',
    category: 'panorama',
    desc: 'Decorative Islamic geometric border, ceremonial',
    size: 'large',
    css: '.tpl-ornate-arabesque{background:#0d1421;border:2px solid #D4AF37;border-radius:0;padding:38px 50px;color:#f4ead5;text-align:center;font-family:"Amiri",Georgia,serif;max-width:640px;position:relative;background-image:radial-gradient(circle at 20% 20%,rgba(212,175,55,.06) 0,transparent 30%),radial-gradient(circle at 80% 80%,rgba(212,175,55,.06) 0,transparent 30%)}.tpl-ornate-arabesque::before,.tpl-ornate-arabesque::after{content:"❋";position:absolute;color:#D4AF37;font-size:1.5rem;opacity:.7}.tpl-ornate-arabesque::before{top:8px;left:14px}.tpl-ornate-arabesque::after{bottom:8px;right:14px}.tpl-ornate-arabesque h3{color:#D4AF37;font-size:1.65rem;margin:0 0 16px;letter-spacing:1px;border-bottom:1px solid rgba(212,175,55,.3);padding-bottom:12px}.tpl-ornate-arabesque .bb{color:#e8dfc7;font-size:.95rem;line-height:1.7;margin:0 0 10px}.tpl-ornate-arabesque .ba{color:#FFD98A;font-style:italic;font-size:1.15rem;margin:12px 0;line-height:1.55;font-family:"Amiri",serif}.tpl-ornate-arabesque .bt{color:#bdb293;font-style:italic;font-size:.85rem}.tpl-ornate-arabesque .sep{width:90px;height:2px;background:linear-gradient(90deg,transparent,#D4AF37,transparent);margin:16px auto}'
  },
  'royal-emerald': {
    name: 'Royal Emerald',
    category: 'panorama',
    desc: 'Deep green with gold accents, regal feel',
    size: 'large',
    css: '.tpl-royal-emerald{background:linear-gradient(135deg,#0a3a2a,#0e5238 50%,#0a3a2a);border:2px solid #D4AF37;border-radius:12px;padding:32px 40px;color:#f0e8c8;text-align:center;font-family:Georgia,serif;box-shadow:0 14px 38px rgba(0,40,20,.55),inset 0 0 0 1px rgba(212,175,55,.2);max-width:580px}.tpl-royal-emerald h3{color:#FFD98A;font-size:1.5rem;margin:0 0 12px;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,.5)}.tpl-royal-emerald .bb{color:#e0e8d8;font-size:.92rem;line-height:1.6;margin:0 0 8px}.tpl-royal-emerald .ba{color:#FFD98A;font-style:italic;font-size:1.08rem;margin:10px 0 4px}.tpl-royal-emerald .bt{color:#b8c8a8;font-style:italic;font-size:.82rem}.tpl-royal-emerald .sep{width:80px;height:2px;background:linear-gradient(90deg,transparent,#D4AF37,transparent);margin:14px auto}'
  },
  'compact-pill': {
    name: 'Compact Pill',
    category: 'overlay',
    desc: 'Small floating pill, ideal for short hints',
    size: 'small',
    css: '.tpl-compact-pill{background:rgba(20,12,4,.92);border:1px solid rgba(201,168,76,.55);border-radius:999px;padding:12px 24px;color:#F4E4BC;text-align:center;font-family:"DM Sans",sans-serif;box-shadow:0 6px 22px rgba(0,0,0,.45);max-width:380px;display:inline-flex;flex-direction:column;align-items:center;gap:4px}.tpl-compact-pill h3{color:#FFD98A;font-size:.95rem;margin:0;font-weight:700}.tpl-compact-pill .bb{color:#e8dfc7;font-size:.78rem;line-height:1.4;margin:0}.tpl-compact-pill .ba,.tpl-compact-pill .bt{display:none}.tpl-compact-pill .sep{display:none}'
  },
  'hero-large': {
    name: 'Hero Large',
    category: 'fullscreen',
    desc: 'Massive ceremonial banner for key moments',
    size: 'xlarge',
    css: '.tpl-hero-large{background:linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border:3px solid #D4AF37;border-radius:20px;padding:48px 56px;color:#fff;text-align:center;font-family:Georgia,serif;box-shadow:0 24px 60px rgba(0,0,0,.65),inset 0 0 0 1px rgba(212,175,55,.25);max-width:760px;position:relative}.tpl-hero-large::before{content:"";position:absolute;inset:10px;border:1px solid rgba(212,175,55,.2);border-radius:14px;pointer-events:none}.tpl-hero-large h3{color:#D4AF37;font-size:2.2rem;margin:0 0 18px;font-weight:700;letter-spacing:.5px;text-shadow:0 2px 8px rgba(212,175,55,.3)}.tpl-hero-large .bb{color:#f4ead5;font-size:1.05rem;line-height:1.7;margin:0 0 10px}.tpl-hero-large .ba{color:#FFD98A;font-style:italic;font-size:1.3rem;margin:14px 0;line-height:1.55}.tpl-hero-large .bt{color:#bdb293;font-style:italic;font-size:.9rem;margin:0 0 10px}.tpl-hero-large .sep{width:120px;height:3px;background:linear-gradient(90deg,transparent,#D4AF37,transparent);margin:18px auto}'
  },
  'side-card': {
    name: 'Side Card',
    category: 'overlay',
    desc: 'Sticky-note style for non-intrusive corner placement',
    size: 'small',
    css: '.tpl-side-card{background:linear-gradient(180deg,#fffbe9,#f5edd0);border-left:4px solid #C9A84C;border-radius:8px;padding:18px 22px;color:#2C1810;text-align:left;font-family:"Poppins",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);max-width:340px}.tpl-side-card h3{color:#8B6914;font-size:1rem;margin:0 0 8px;font-weight:700}.tpl-side-card .bb{color:#3D2B1F;font-size:.82rem;line-height:1.5;margin:0 0 6px}.tpl-side-card .ba{color:#8B6914;font-style:italic;font-size:.92rem;margin:6px 0 3px}.tpl-side-card .bt{color:#6B5B4F;font-style:italic;font-size:.76rem}.tpl-side-card .sep{width:40px;height:1px;background:#C9A84C;margin:8px 0;opacity:.5}'
  },
  'midnight-blue': {
    name: 'Midnight Blue',
    category: 'panorama',
    desc: 'Calm night-sky aesthetic with starlight gold',
    size: 'medium',
    css: '.tpl-midnight-blue{background:radial-gradient(ellipse at top,#1e3a5f,#0d1b2a);border:1px solid #D4AF37;border-radius:14px;padding:28px 36px;color:#e8eef4;text-align:center;font-family:"Poppins",sans-serif;box-shadow:0 12px 36px rgba(0,0,0,.55);max-width:520px;position:relative;overflow:hidden}.tpl-midnight-blue::after{content:"✦ ✦ ✦";position:absolute;top:8px;left:0;right:0;text-align:center;color:rgba(255,217,138,.4);font-size:.7rem;letter-spacing:8px}.tpl-midnight-blue h3{color:#FFD98A;font-size:1.35rem;margin:14px 0 10px;font-weight:600}.tpl-midnight-blue .bb{color:#d8e0e8;font-size:.9rem;line-height:1.6;margin:0 0 6px}.tpl-midnight-blue .ba{color:#FFD98A;font-style:italic;font-size:1.05rem;margin:8px 0;line-height:1.5}.tpl-midnight-blue .bt{color:#a8b8c8;font-style:italic;font-size:.8rem}.tpl-midnight-blue .sep{width:50px;height:1px;background:rgba(255,217,138,.5);margin:12px auto}'
  },
  'sunrise-gold': {
    name: 'Sunrise Gold',
    category: 'panorama',
    desc: 'Warm sunrise gradient, joyful celebratory feel',
    size: 'medium',
    css: '.tpl-sunrise-gold{background:linear-gradient(135deg,#FFE5B4 0%,#FFD98A 50%,#E8B860 100%);border:2px solid #B8941F;border-radius:16px;padding:28px 36px;color:#3D2B1F;text-align:center;font-family:"Poppins",sans-serif;box-shadow:0 14px 38px rgba(184,148,31,.4);max-width:540px}.tpl-sunrise-gold h3{color:#8B4513;font-size:1.4rem;margin:0 0 12px;font-weight:700}.tpl-sunrise-gold .bb{color:#3D2B1F;font-size:.92rem;line-height:1.6;margin:0 0 8px}.tpl-sunrise-gold .ba{color:#8B4513;font-style:italic;font-size:1.05rem;margin:10px 0;line-height:1.5}.tpl-sunrise-gold .bt{color:#5C4030;font-style:italic;font-size:.82rem}.tpl-sunrise-gold .sep{width:60px;height:2px;background:linear-gradient(90deg,transparent,#8B4513,transparent);margin:14px auto}'
  },
  'ihram-guide': {
    name: 'Ihram Guide Card',
    category: 'guide',
    desc: 'Full-screen guide card (used for Welcome/Cleansing/Niyyah)',
    size: 'xlarge',
    css: '.tpl-ihram-guide{background:radial-gradient(circle at top,#1a2438 0%,#0a0e1a 100%);border:2px solid #D4AF37;border-radius:14px;padding:30px 36px;color:#f4ead5;font-family:Georgia,serif;max-width:680px;box-shadow:0 18px 44px rgba(0,0,0,.55)}.tpl-ihram-guide h3{color:#D4AF37;margin:0 0 14px;font-size:1.6rem;text-align:center}.tpl-ihram-guide .bb{font-size:.95rem;line-height:1.65;color:#e8dfc7;margin:0 0 10px}.tpl-ihram-guide .ba{color:#FFD98A;font-style:italic;font-size:1.15rem;margin:12px 0;text-align:center}.tpl-ihram-guide .bt{color:#bdb293;font-style:italic;font-size:.85rem;text-align:center}.tpl-ihram-guide ul{padding-left:22px;line-height:1.7;margin:8px 0}.tpl-ihram-guide li{margin-bottom:6px}.tpl-ihram-guide h4{color:#D4AF37;margin:14px 0 6px;font-size:1.05rem}.tpl-ihram-guide .sep{width:100px;height:1px;background:linear-gradient(90deg,transparent,#D4AF37,transparent);margin:14px auto}'
  }
};

/* ═══════════════════════════════════════════════
   DEFAULT SEED DATA
   Body HTML mirrors live VR scene content exactly.
   ═══════════════════════════════════════════════ */
function defB(o){
  // Banner factory: applies sensible defaults
  o.template = o.template || 'classic-gold';
  o.position = o.position || {x:50,y:50,align:'center',width:'auto'};
  return o;
}

var DEFAULT_DATA = {
  languages: [
    {code:'en', name:'English', dir:'ltr', isDefault:true},
    {code:'ar', name:'العربية', dir:'rtl', isDefault:false}
  ],
  scenes: [
    /* ──────────── Step 1 — Tawaf (Initial Umrah) ──────────── */
    { key:'tawaf-initial', step:1, title:'Step 1 — Tawaf (Initial Umrah)', file:'pilgrimspath-vr/pilgrims path main/1 Tawaf/index.htm', context:'initial',
      panoramas:['panorama_8CE4041C_9544_BA06_41E1_5E77B48B16C5','panorama_89070D75_955C_4A01_41D4_F7F58617B959','panorama_7F92625E_71D8_25CE_41DA_487A76BA9DE1','panorama_7F927F34_71D8_3B52_41C5_1D549449A4CF','panorama_7F9246DB_71D8_6AD6_41DA_A3880DC6DC13'],
      banners:[
        defB({ id:'tw-guide-0', trigger:'guide-screen-0', label:'🕋 Screen 1 of 3 — Welcome (FIRST, on scene load)', template:'ihram-guide',
          text:{en:{title:'Welcome',body:'<p class="bb">Welcome to this immersive Hajj experience, a journey of faith, devotion, and unity. Together, we will explore the sacred rites, duas, and profound meanings of Hajj, bringing you closer to the essence of Hajj.</p><p class="bt">May Allah accept your intentions and grant you blessings as we walk this path together.</p>'}},
          audio:{en:'English Welcome Info.mp3'} }),
        defB({ id:'tw-guide-1', trigger:'guide-screen-1', label:'🤲 Screen 2 of 3 — Cleansing & Garments', template:'ihram-guide',
          text:{en:{title:'Cleansing & Garments',body:'<ul><li>Perform <strong>Ghusl</strong> (full ritual bath) or at minimum Wudu</li><li><strong>For men:</strong> Wear two white unstitched cloths — the Izaar (lower body) and the Rida (over the shoulder)</li><li><strong>For women:</strong> Wear modest, loose clothing covering the body; your face and hands remain uncovered</li><li>You may apply fragrance to your body (not the garments) before making your intention</li></ul>'}},
          audio:{en:'English Ihram part 1.mp3'}, audioChain:{en:'English Ihram part 2 .mp3'} }),
        defB({ id:'tw-guide-2', trigger:'guide-screen-2', label:'👔 Screen 3 of 3 — Ihram, Restrictions & Niyyah at Miqat', template:'ihram-guide',
          text:{en:{title:'Your Ihram & Niyyah',body:'<h4>⚠ Ihram Restrictions</h4><p class="bb">Once in the state of Ihram, observe these restrictions:</p><ul><li><strong>Men:</strong> two seamless white garments only</li><li><strong>Women:</strong> modest clothing covering the body</li><li>No <strong>perfume</strong> or scented products</li><li>No cutting <strong>hair or nails</strong></li><li>No <strong>marital relations</strong></li><li>No <strong>hunting</strong> animals</li><li>No <strong>disputes</strong> or arguments</li></ul><h4>Your Niyyah at the Miqat</h4><p class="bb"><strong>You must make your Niyyah before or at the Miqat boundary.</strong> The Miqat is the sacred boundary you cross on your journey — once past it, you must already be in the state of Ihram.</p><p class="bb">Declare your intention for Umrah or Hajj clearly:</p><p class="ba" style="direction:rtl;font-size:1.4em">اللَّهُمَّ إِنِّي أُرِيدُ الْعُمْرَةَ فَيَسِّرْهَا لِي وَتَقَبَّلْهَا مِنِّي</p><p class="ba">"Allahumma inni ureedal Umrata fa yassirha li wa taqabbalha minni"</p><p class="bt">"O Allah, I intend to perform Umrah, so make it easy for me and accept it from me."</p>'}},
          audio:{en:'English Ihram part 3.mp3'} }),
        defB({ id:'tw-pano-8CE4041C', trigger:'panorama', panorama:'panorama_8CE4041C_9544_BA06_41E1_5E77B48B16C5', label:'Entrance to the Haram',
          text:{en:{title:'🕌 Entering the Haram Mosque',body:'<p class="bb"><strong>Voice-over:</strong> As you approach the sacred mosque, Al-Masjid Al-Haram, enter with humility and reverence. Step forward with your right foot and recite:</p><p class="ba">Bismillahi, Allahumma salli ala Muhammadin wa ali Muhammad. Allahumma ighfir li dhunubi wa iftah li abwaba rahmatika.</p><p class="bt">Translation: "In the name of Allah, O Allah, send prayers upon Muhammad and his family. O Allah, forgive my sins and open the gates of Your mercy."</p>'}},
          audio:{en:'English Entering the haram mosque.mp3'} }),
        defB({ id:'tw-pano-89070D75', trigger:'panorama', panorama:'panorama_89070D75_955C_4A01_41D4_F7F58617B959', label:'First sight of the Kaaba',
          text:{en:{title:'🤲 Dua upon Seeing the Kaaba for the First Time',body:'<p class="bb"><strong>Voice-over:</strong> Upon sighting the Kaaba, raise your hands and make any personal dua you wish. This is a moment when your dua is especially powerful. You may also recite:</p><p class="ba">Allahumma zid hadha al-bayt tashreefan wa ta\'dheeman wa takreeman wa mahabatan, wa zid man sharrafahu wa karramahu mimman hajjahu awi\'tamarahu tashreefan wa takreeman wa ta\'dheeman wa birran.</p><p class="bt">Translation: "O Allah, increase this house (the Kaaba) in honor, nobility, and respect, and increase in honor and nobility the one who honors and respects it."</p>'}},
          audio:{en:'English Upon seeing the ka_aba.mp3'} }),
        defB({ id:'tw-pano-7F92625E', trigger:'panorama', panorama:'panorama_7F92625E_71D8_25CE_41DA_487A76BA9DE1', label:'Begin Tawaf (starting point)',
          text:{en:{title:'🕋 Tawaf — Circumambulation of the Kaaba',body:'<p class="bb"><strong>Voice-over:</strong> You will now begin Tawaf, circling the Kaaba seven times. Starting from the Black Stone, raise your hand towards it, and say:</p><p class="ba">Bismillahi Allahu Akbar</p><p class="bt">(In the name of Allah, Allah is the Greatest).</p><div class="sep"></div><p class="bb">You have now begun your Tawaf — you may recite any duas or dhikr that you find meaningful.</p>'}},
          audio:{en:'English Tawaf.mp3'} }),
        defB({ id:'tw-pano-7F927F34', trigger:'panorama', panorama:'panorama_7F927F34_71D8_3B52_41C5_1D549449A4CF', label:'Yemeni Corner (Rukn al-Yamani)',
          text:{en:{title:'🕋 Al-Rukn al-Yamani — Yemeni Corner',body:'<p class="bb">As you pass the Yemeni Corner (al-Rukn al-Yamani), touch it with your right hand if possible and say: <strong>Bismillahi Allahu Akbar</strong>.</p><p class="bb">Between the Yemeni Corner and the Black Stone, recite:</p><p class="ba">Rabbana atina fid-dunya hasanatan, wa fil-akhirati hasanatan, wa qina adhaban-nar.</p><p class="bt">Translation: "O our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire."</p>'}},
          audio:{en:'English Yemeni Corner.mp3'} }),
        defB({ id:'tw-pano-7F9246DB', trigger:'panorama', panorama:'panorama_7F9246DB_71D8_6AD6_41DA_A3880DC6DC13', label:'Maqam Ibrahim',
          text:{en:{title:'🧎 Praying at Maqam Ibrahim',body:'<p class="bb"><strong>Voice-over:</strong> Here at the Maqam Ibrahim (the Station of Ibrahim), you may offer two rak\'ahs of Salah.</p><p class="bb">In the first rak\'ah, recite Surah Al-Fatiha followed by Surah Al-Kafirun. In the second rak\'ah, recite Surah Al-Fatiha followed by Surah Al-Ikhlas.</p><p class="bb">After completing the prayer, make any personal supplications.</p>'}},
          audio:{en:'English Maqama Ibrahim.mp3'} })
      ]},

    /* ──────────── Step 2 — Sa'i ──────────── */
    { key:'safa-marwa', step:2, title:"Step 2 — Sa'i (Safa & Marwa)", file:'pilgrimspath-vr/pilgrims path main/2 Safa and Marwa/index.htm', context:'sa-i',
      panoramas:['panorama_740A042A_7348_ED6D_41CA_00F715E5C1F1','panorama_740A504C_7348_2525_41D3_C8D1BB48BC81','panorama_77BBA118_7348_272D_41C8_26E405934981'],
      banners:[
        defB({ id:'sm-pano-1', trigger:'panorama', panorama:'panorama_740A042A_7348_ED6D_41CA_00F715E5C1F1', label:'Beginning at Safa', template:'parchment-frame',
          text:{en:{title:"🕋 Sa'i Between Safa and Marwa",body:'<p class="bb">You will now perform Sa\'i, walking between Safa and Marwa. Begin at Safa, facing the Kaaba, and recite:</p><p class="ba">Inna as-safa wal-marwata min sha\'a\'irillah.</p><p class="bt">Translation: "Indeed, Safa and Marwa are among the symbols of Allah."</p><div class="sep"></div><p class="bb">You may also recite:</p><p class="ba">Abda\'u bimā badā\' Allāhu bih.</p><p class="bt">Translation: "I begin with that which Allah has begun with."</p><p class="ba">Lā ilāha illa Allāhu waḥdahu lā sharīka lah, lahu l-mulku wa lahu l-ḥamd, yuḥyī wa yumīt, wa huwa ʿalā kulli shay\'in qadīr.</p><p class="bt">Translation: "There is no deity except Allah, alone without a partner. To Him belongs the Dominion, and to Him belongs all praise. He gives life and death, and He has power over everything."</p><p class="ba">Lā ilāha illa Allāhu waḥdah, anjaza waʿdahu wa naṣara ʿabdahu wa hazama l-aḥzāba waḥdah.</p><p class="bt">Translation: "There is no deity except Allah alone. He fulfilled His promise, supported His slave and defeated the Confederates alone."</p>'}},
          audio:{en:'English Safa and Marwa.mp3'} }),
        defB({ id:'sm-pano-2', trigger:'panorama', panorama:'panorama_740A504C_7348_2525_41D3_C8D1BB48BC81', label:'Walking between hills',
          text:{en:{title:'🚶 Walking Between Safa and Marwa',body:'<p class="bb">As you walk between the two hills seven times, recite dhikr and personal duas.</p><p class="bb">When you reach the green markers, hasten your pace (men only), then resume walking at a normal pace after passing them.</p><p class="bb">Complete Sa\'i by reaching Marwa for the seventh time.</p>'}},
          audio:{en:'Safaandmarwa3.mp3'} }),
        defB({ id:'sm-pano-3', trigger:'panorama', panorama:'panorama_77BBA118_7348_272D_41C8_26E405934981', label:'Halaq / Completion', template:'sunrise-gold',
          text:{en:{title:'✂️ Halaq or Qasar',body:'<p class="bb"><strong>Voice-over:</strong> Upon completing Sa\'i, men get their heads shaved or trimmed, while women only get their hair trimmed.</p><p class="bb">This now signifies you are out of the boundaries of Ihram and will await the 8th of Dhul-Hijjah.</p><div class="sep"></div><h3 style="color:#22c55e">🎉 Congratulations</h3><p class="bb">You have now completed Umrah.</p>'}},
          audio:{en:'English Congratulations Umrah .mp3'} })
      ]},

    /* ──────────── Step 3 — Clip/Shave (Umrah) ──────────── */
    { key:'barber-umrah', step:3, title:'Step 3 — Clip/Shave Hair (Umrah)', file:'pilgrimspath-vr/pilgrims path main/5 .../barber-scene.html', context:'umrah-trim',
      panoramas:[],
      banners:[
        defB({ id:'bu-load', trigger:'scene-load', label:'Scene load — Umrah trim', template:'side-card',
          text:{en:{title:'✂️ Trim Your Hair',body:'<p class="bb">A small symbolic trim completes your Umrah and exits the state of Ihram. Men may shave or trim, women trim a fingertip\'s length.</p>'}},
          audio:{en:'English Halaq.mp3'} })
      ]},

    /* ──────────── Step 6 — Mina (8th Day) ──────────── */
    { key:'mina-8th', step:6, title:'Step 6 — Arrive at Mina (8th Day)', file:'pilgrimspath-vr/pilgrims path main/3 Mina/index.htm', context:'8th-day',
      panoramas:['panorama_73D8B866_7C54_4D8A_41D3_BF331164945C'],
      banners:[
        defB({ id:'mn-pano-8th', trigger:'panorama', panorama:'panorama_73D8B866_7C54_4D8A_41D3_BF331164945C', label:'Mina arrival (8th)',
          text:{en:{title:'🕌 8th Day of Dhul-Hijjah — Yawm at-Tarwiyah',body:'<p class="bb">On this day, the 8th day of Dhul-Hijjah, known as Yawm at-Tarwiyah, you have arrived at Mina where you will spend the day in worship. Arrival is before noon.</p><p class="bb">You will offer the following prayers, but some are shortened to two rak\'ahs — the likes of Zuhr, Asr &amp; Isha.</p><p class="bb">Throughout the day, continue reciting the Talbiyah and prepare for the Day of Arafah.</p>'}},
          audio:{en:'English 8th Day of Dhul-Hijjah .mp3'} })
      ]},

    /* ──────────── Step 7 — Arafah (sequenced) ──────────── */
    { key:'arafah-9th', step:7, title:'Step 7 — Day of Arafah (9th Day)', file:'pilgrimspath-vr/pilgrims path main/4 Arafah/index.htm', context:'9th-day',
      panoramas:[],
      banners:[
        defB({ id:'ar-seq-1', trigger:'sequence-1', label:'Arafah banner 1 of 3 — Day of Arafah', template:'hero-large',
          text:{en:{title:'🤲 9th Day of Dhul-Hijjah — Day of Arafah',body:'<p class="bb">On this day, the 9th day — the Day of Arafah — we have now arrived on the plains of Arafat. Walk your way to the summit as this is a pivotal moment, where your supplications are answered.</p>'}},
          audio:{en:'English Arafah 1.mp3'} }),
        defB({ id:'ar-seq-2', trigger:'sequence-2', label:'Arafah banner 2 of 3 — Travelling to Muzdalifah', template:'midnight-blue',
          text:{en:{title:'🌙 Travelling to Muzdalifah',body:'<p class="bb">You will now be taken to Muzdalifah. Here, pray Maghrib and Isha together, shortened and combined, with one Adhan and two Iqamahs. At Muzdalifah go collect at least 49 or 70 pebbles for the stoning ritual for the next day.</p>'}},
          audio:{en:'English Arafah 2.mp3'} }),
        defB({ id:'ar-seq-3', trigger:'sequence-3', label:'Arafah banner 3 of 3 — Congratulations', template:'sunrise-gold',
          text:{en:{title:'🎉 Congratulations',body:'<p class="bb">Congratulations — you may now proceed to any resting area under the open sky.</p>'}},
          audio:{en:'English Arafah 3.mp3'} })
      ]},

    /* ──────────── Step 9 — Rami al-Aqabah (10th) ──────────── */
    { key:'jamarat-10th', step:9, title:'Step 9 — Rami al-Aqabah (10th Day)', file:'pilgrimspath-vr/pilgrims path main/5 .../Jamarat rooftop/index.htm', context:'10th-day',
      panoramas:['panorama_691B217E_7C54_3E7A_41D3_35A255D72204','panorama_6B19BBC3_7C55_C28B_41C0_A1D9ED0027F1'],
      banners:[
        defB({ id:'jm10-pano-aqabah', trigger:'panorama', panorama:'panorama_691B217E_7C54_3E7A_41D3_35A255D72204', label:'10th — Aqabah pillar',
          text:{en:{title:"🕋 10th Day — Rami al-Jamrah al-ʿAqabah",body:'<p class="bb">It is the morning of the 10th of Dhul-Hijjah — <strong>Yawm an-Nahr</strong>. After leaving Muzdalifah you arrive at Mina to perform the first stoning of Hajj.</p><p class="bb"><strong>Today only one pillar is stoned:</strong> Jamrah al-ʿAqabah (the largest). You will throw <strong>seven pebbles</strong>, one at a time, with each throw saying:</p><p class="ba">Bismillāh, Allāhu Akbar.</p><p class="bt">In the name of Allah, Allah is the Greatest.</p><div class="sep"></div><p class="bb">Turn until the screen glows green and the pillar is in view, then tap <strong>Throw Stone</strong>. After the seventh throw you will continue to the Qurbani (sacrifice).</p>'}},
          audio:{en:'English Day 10 Yawn An Nahr 1.mp3'} }),
        defB({ id:'jm10-pano-rooftop', trigger:'panorama', panorama:'panorama_6B19BBC3_7C55_C28B_41C0_A1D9ED0027F1', label:'10th — Rooftop overview',
          text:{en:{title:'🕋 10th Day of Dhul-Hijjah — Yawm an-Nahr',body:'<p class="bb">Today is the 10th day, Yawm an-Nahr. After completing Fajr prayer, we have now arrived at Rami al-Jamarat where we will perform the full ritual:</p><p class="bb">• Stone Jamrah al-Aqaba (the large pillar) only once with 7 pebbles<br>• Perform Qurbani (animal sacrifice)<br>• Shave or trim your hair<br>• Return to Al-Masjid Al-Haram for Tawaf al-Ifadha</p>'}},
          audio:{en:'English Day 10 Yawn An Nahr 1.mp3'} })
      ]},

    /* ──────────── Step 10 — Qurbani ──────────── */
    { key:'qurbani-10th', step:10, title:'Step 10 — Qurbani (Sacrifice)', file:'pilgrimspath-vr/pilgrims path main/5 .../qurbani-scene.html', context:'sacrifice',
      panoramas:[],
      banners:[
        defB({ id:'qb-load', trigger:'scene-load', label:'Scene load — Qurbani', template:'side-card',
          text:{en:{title:'🐑 Qurbani — The Sacrifice',body:'<p class="bb">Offer the ritual sacrifice in remembrance of Ibrahim\'s submission to Allah. The meat is distributed to the poor, family, and self.</p>'}},
          audio:{en:'English Day 10 -2.mp3'} })
      ]},

    /* ──────────── Step 11 — Halaq (Hajj) ──────────── */
    { key:'barber-hajj', step:11, title:'Step 11 — Shave Head (Halaq)', file:'pilgrimspath-vr/pilgrims path main/5 .../barber-scene.html', context:'barber',
      panoramas:[],
      banners:[
        defB({ id:'bh-load', trigger:'scene-load', label:'Scene load — Halaq', template:'side-card',
          text:{en:{title:'✂️ Halaq — Shaving the Head',body:'<p class="bb">Men fully shave or trim their hair. Women trim a fingertip\'s length. This marks the end of most Ihram restrictions.</p>'}},
          audio:{en:'English Day 10-3.mp3'} })
      ]},

    /* ──────────── Step 12 — Tawaf al-Ifadha ──────────── */
    { key:'tawaf-ifadha', step:12, title:'Step 12 — Tawaf al-Ifadha', file:'pilgrimspath-vr/pilgrims path main/1 Tawaf/index.htm', context:'ifadha',
      panoramas:['panorama_8CE4041C_9544_BA06_41E1_5E77B48B16C5','panorama_7F92DC96_71D8_1D5E_41BF_87B612A8A131','panorama_8AF67A73_955C_4E01_41DA_44BCCE2B395A','panorama_8AC63E8D_9544_C601_41E0_0A05A67E5557'],
      banners:[
        defB({ id:'ti-pano-1', trigger:'panorama', panorama:'panorama_8CE4041C_9544_BA06_41E1_5E77B48B16C5', label:'Ifadha entry',
          text:{en:{title:'🕌 Tawaf al-Ifadha (Circumambulation of Visiting)',body:'<p class="bb">You now perform Tawaf al-Ifadha, the obligatory circumambulation on the 10th of Dhul-Hijjah after leaving Muzdalifah.</p><p class="bb">This Tawaf comes after the animal sacrifice and hair shaving. Begin from the Black Stone and circle the Kaaba seven times with the same reverence as your initial Tawaf.</p><p class="bb">Make sincere duas for yourself, your family, and the ummah as you walk around the House of Allah.</p>'}},
          audio:{en:'English Day 10-4.mp3'} }),
        defB({ id:'ti-pano-2', trigger:'panorama', panorama:'panorama_7F92DC96_71D8_1D5E_41BF_87B612A8A131', label:'Continuing Ifadha',
          text:{en:{title:'🤲 Continuing Your Second Tawaf',body:'<p class="bb">Continue your circumambulation with devotion and focus.</p><p class="bb">Remember that this Tawaf is an essential pillar of Hajj on the day of Eid al-Adha.</p>'}},
          audio:{en:''} }),
        defB({ id:'ti-pano-3', trigger:'panorama', panorama:'panorama_8AF67A73_955C_4E01_41DA_44BCCE2B395A', label:'Ifadha progress',
          text:{en:{title:'🕋 Tawaf al-Ifadha Progress',body:'<p class="bb">You are progressing through your Tawaf al-Ifadha. Maintain your focus and complete all seven circuits with mindfulness.</p><p class="ba">Recite as you walk: Subhana\'Allah wa\'l-hamdulillah wa la ilaha illallah wa\'Allahu Akbar.</p>'}},
          audio:{en:''} }),
        defB({ id:'ti-pano-4', trigger:'panorama', panorama:'panorama_8AC63E8D_9544_C601_41E0_0A05A67E5557', label:'Ifadha completion',
          text:{en:{title:'🧎 Salah After Tawaf al-Ifadha',body:'<p class="bb">After completing your Tawaf al-Ifadha, offer two rak\'ahs of prayer at Maqam Ibrahim or nearby in the mosque.</p><p class="bb">Then proceed to perform Sa\'i (the walking between Safa and Marwa) to complete the major rituals of Hajj.</p>'}},
          audio:{en:'English Day 10-5.mp3'} })
      ]},

    /* ──────────── Step 13 — Rami All Pillars (11th) ──────────── */
    { key:'jamarat-11th', step:13, title:'Step 13 — Rami All Pillars (11th Day)', file:'pilgrimspath-vr/pilgrims path main/5 .../Jamarat rooftop/index.htm', context:'11th-day',
      panoramas:['panorama_6B19BBC3_7C55_C28B_41C0_A1D9ED0027F1'],
      banners:[
        defB({ id:'jm11-pano', trigger:'panorama', panorama:'panorama_6B19BBC3_7C55_C28B_41C0_A1D9ED0027F1', label:'11th — All pillars',
          text:{en:{title:'🕋 11th Day of Dhul-Hijjah — Days of Tashreeq',body:'<p class="bb">On the 11th day, you return to Rami al-Jamarat. Today you will stone all three pillars in order:</p><p class="bb">• Jamrah as-Sughra (small) — 7 pebbles<br>• Jamrah al-Wusta (middle) — 7 pebbles<br>• Jamrah al-Aqaba (large) — 7 pebbles<br><br>Total: 21 pebbles. After completing the stoning, you may rest at your lodging in Mina or proceed to Muzdalifah if leaving on this day.</p>'}},
          audio:{en:'English Day 11- dhul hijja.mp3'} }),
        defB({ id:'jm11-complete', trigger:'completion', label:'After all 21 stones thrown', template:'compact-pill',
          text:{en:{title:'Day 11 Complete',body:'<p class="bb">Return to your tent at Mina for rest and prayer.</p>'}},
          audio:{en:'English Day 11- dhul hijja 2.mp3'} })
      ]},

    /* ──────────── Step 14 — Mina Tents (12th) ──────────── */
    { key:'mina-tents-12', step:14, title:'Step 14 — Spend Night at Mina (12th)', file:'pilgrimspath-vr/pilgrims path main/3 Mina/index.htm', context:'tents-12th',
      panoramas:['panorama_72AD4A6A_7C54_4D9A_41DC_AA69EFBD3C52'],
      banners:[
        defB({ id:'mn12-pano', trigger:'panorama', panorama:'panorama_72AD4A6A_7C54_4D9A_41DC_AA69EFBD3C52', label:'12th — Tent',
          text:{en:{title:'⛺ Back at Your Mina Tent (12th Day)',body:'<p class="bb">Alhamdulillah, you completed the 11th day stoning and have returned to your tent.</p><p class="bb">Tomorrow you will once again perform Rami al-Jamarat at the three pillars in the same order: Sughra → Wusta → ʿAqabah, seven pebbles at each.</p>'}},
          audio:{en:'English Day 12-Dhul hijjah.mp3'} })
      ]},

    /* ──────────── Step 15 — Rami All Pillars (12th) ──────────── */
    { key:'jamarat-12th', step:15, title:'Step 15 — Rami All Pillars (12th Day)', file:'pilgrimspath-vr/pilgrims path main/5 .../Jamarat rooftop/index.htm', context:'12th-day',
      panoramas:['panorama_6B19BBC3_7C55_C28B_41C0_A1D9ED0027F1'],
      banners:[
        defB({ id:'jm12-pano', trigger:'panorama', panorama:'panorama_6B19BBC3_7C55_C28B_41C0_A1D9ED0027F1', label:'12th — All pillars',
          text:{en:{title:'🕋 12th Day of Dhul-Hijjah — Days of Tashreeq',body:'<p class="bb">On the 12th day, you return again to Rami al-Jamarat. Today you will stone all three pillars:</p><p class="bb">• Jamrah as-Sughra (small) — 7 pebbles<br>• Jamrah al-Wusta (middle) — 7 pebbles<br>• Jamrah al-Aqaba (large) — 7 pebbles<br><br>After completing today\'s stoning, you may choose to depart Mina (though you can also stay until the 13th). If you depart, perform Tawaf al-Wida before leaving.</p>'}},
          audio:{en:'English Day 13 dhul hijjah.mp3'} }),
        defB({ id:'jm12-complete', trigger:'completion', label:'After all 21 stones thrown', template:'compact-pill',
          text:{en:{title:'Hajj Stoning Complete',body:'<p class="bb">You may now depart Mina. Perform the Farewell Tawaf before leaving.</p>'}},
          audio:{en:'English Day 13 Dhul hijjah 2.mp3'} })
      ]},

    /* ──────────── Step 16 — Farewell Tawaf ──────────── */
    { key:'tawaf-farewell', step:16, title:"Step 16 — Farewell Tawaf al-Wida'", file:'pilgrimspath-vr/pilgrims path main/1 Tawaf/index.htm', context:'farewell',
      panoramas:['panorama_8CE4041C_9544_BA06_41E1_5E77B48B16C5','panorama_7F92DC96_71D8_1D5E_41BF_87B612A8A131','panorama_8AF67A73_955C_4E01_41DA_44BCCE2B395A','panorama_8AC63E8D_9544_C601_41E0_0A05A67E5557'],
      banners:[
        defB({ id:'tf-pano-1', trigger:'panorama', panorama:'panorama_8CE4041C_9544_BA06_41E1_5E77B48B16C5', label:'Farewell entry', template:'royal-emerald',
          text:{en:{title:"🕌 Tawaf al-Wida (Farewell Circumambulation)",body:'<p class="bb">You now perform your final Tawaf, called Tawaf al-Wida (the Farewell Circumambulation), as your last ritual before departing the holy house.</p><p class="bb">Circle the Kaaba seven times with devoted dua, bidding farewell to this sacred place. This is your last opportunity to make sincere supplications in the Haram before departing.</p>'}},
          audio:{en:'English Farewell Tawaf.mp3'} }),
        defB({ id:'tf-pano-2', trigger:'panorama', panorama:'panorama_7F92DC96_71D8_1D5E_41BF_87B612A8A131', label:'Final moments', template:'royal-emerald',
          text:{en:{title:'🤲 Final Moments at the Kaaba',body:'<p class="bb">As you walk in Tawaf al-Wida, reflect on your Hajj journey and the spiritual transformation you have undergone.</p><p class="bb">Make heartfelt duas for your loved ones and ask Allah to accept your pilgrimage.</p>'}},
          audio:{en:''} }),
        defB({ id:'tf-pano-3', trigger:'panorama', panorama:'panorama_8AF67A73_955C_4E01_41DA_44BCCE2B395A', label:'Farewell progress', template:'royal-emerald',
          text:{en:{title:'🕋 Completing Your Final Circumambulation',body:'<p class="bb">Continue with devotion as you complete the final circuits of Tawaf al-Wida.</p><p class="ba">May Allah accept from you and grant you the rewards of a blessed Hajj.</p>'}},
          audio:{en:''} }),
        defB({ id:'tf-pano-4', trigger:'panorama', panorama:'panorama_8AC63E8D_9544_C601_41E0_0A05A67E5557', label:'Farewell completion', template:'hero-large',
          text:{en:{title:'🎉 Hajj Complete — Mabrook!',body:'<p class="bb">Offer your final prayer in Al-Masjid Al-Haram, making duas and seeking Allah\'s blessings one last time.</p><p class="bb">This concludes your Hajj journey. May Allah accept your pilgrimage and grant you safe travels home.</p>'}},
          audio:{en:'English Farewell Tawaf Congratulations.mp3'} })
      ]}
  ]
};

/* ─── State ─── */
var data = null;
var activeSceneKey = null;
var activeLang = 'en';
var activeView = 'editor'; // 'editor' | 'panoramas'
var dirty = false;
var injectedTplCss = {}; // template ID → true once injected

/* ─── Storage ─── */
function load(){
  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      data = JSON.parse(raw);
      // Migrate older entries: add template/position defaults
      data.scenes.forEach(function(s){
        if(!s.panoramas) s.panoramas = [];
        s.banners.forEach(function(b){
          if(!b.template) b.template = (/^guide-screen-/.test(b.trigger)?'ihram-guide':'classic-gold');
          if(!b.position) b.position = {x:50,y:50,align:'center',width:'auto'};
        });
      });
      // Re-sync text/audio from defaults if seed version changed.
      // This pulls in updated body HTML, audio chains, and any newly-added banners
      // without discarding user-set template/position fields.
      if((data.seedVersion||0) < SEED_VERSION){
        resyncFromDefaults();
        data.seedVersion = SEED_VERSION;
        save(true);
      }
    }
    else { data = JSON.parse(JSON.stringify(DEFAULT_DATA)); data.seedVersion = SEED_VERSION; save(true); }
  }catch(e){
    console.error('[JourneyContent] load failed, resetting',e);
    data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  activeSceneKey = data.scenes[0]&&data.scenes[0].key;
  activeLang = (data.languages.find(function(l){return l.isDefault;})||data.languages[0]).code;
}
function save(silent){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  dirty = false;
  if(!silent) flash('Saved');
  if(typeof renderStatus==='function') renderStatus();
}
function markDirty(){ dirty = true; renderStatus(); }

function flash(msg, isErr){
  var el = document.getElementById('jcFlash'); if(!el) return;
  el.textContent = msg;
  el.style.background = isErr?'rgba(220,53,69,0.18)':'rgba(40,167,69,0.18)';
  el.style.color = isErr?'#ff6b78':'#5fd084';
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.style.opacity='0'; }, 2200);
}

/* ─── Helpers ─── */
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function findScene(k){ return data.scenes.find(function(s){return s.key===k;}); }

/* Re-sync banner text + audio from DEFAULT_DATA, preserving ALL user customisations.
   Only ADDS new scenes/banners that don't yet exist locally; never overwrites
   text/audio/template/position the user has saved. Use the per-banner Reset
   button or the global Reset to defaults action to roll back manually. */
function resyncFromDefaults(){
  DEFAULT_DATA.scenes.forEach(function(ds){
    var ls = data.scenes.find(function(x){return x.key===ds.key;});
    if(!ls){ data.scenes.push(JSON.parse(JSON.stringify(ds))); return; }
    if(ds.panoramas && (!ls.panoramas || !ls.panoramas.length)) ls.panoramas = ds.panoramas.slice();
    ds.banners.forEach(function(db){
      var lb = ls.banners.find(function(x){return x.id===db.id;});
      if(!lb){ ls.banners.push(JSON.parse(JSON.stringify(db))); return; }
      // Existing banner: keep ALL user values. Only fill in missing structural fields.
      if(!lb.template) lb.template = db.template || 'classic-gold';
      if(!lb.position) lb.position = db.position || {x:50,y:50,align:'center',width:'auto'};
      if(!lb.trigger && db.trigger) lb.trigger = db.trigger;
      if(!lb.panorama && db.panorama) lb.panorama = db.panorama;
      if(!lb.label && db.label) lb.label = db.label;
    });
  });
}

/* Reset a single banner's text/audio back to its DEFAULT_DATA seed (template/position kept). */
function resetBannerToDefault(sceneKey, bannerId){
  var ds = DEFAULT_DATA.scenes.find(function(s){return s.key===sceneKey;}); if(!ds) return false;
  var db = ds.banners.find(function(b){return b.id===bannerId;}); if(!db) return false;
  var ls = findScene(sceneKey); if(!ls) return false;
  var lb = findBanner(ls,bannerId); if(!lb) return false;
  lb.text = JSON.parse(JSON.stringify(db.text||{}));
  lb.audio = db.audio?JSON.parse(JSON.stringify(db.audio)):{};
  lb.audioChain = db.audioChain?JSON.parse(JSON.stringify(db.audioChain)):{};
  if(db.label) lb.label = db.label;
  return true;
}
function findBanner(scene,id){ return scene.banners.find(function(b){return b.id===id;}); }
function audioUrl(file){ if(!file) return ''; if(/^(https?:|data:|blob:)/i.test(file)) return file; return AUDIO_BASE+encodeURIComponent(file); }
function injectTplCss(tplId){
  if(injectedTplCss[tplId]) return;
  var t = BANNER_TEMPLATES[tplId]; if(!t) return;
  var el = document.createElement('style');
  el.setAttribute('data-jc-tpl', tplId);
  el.textContent = t.css;
  document.head.appendChild(el);
  injectedTplCss[tplId] = true;
}

/* ─── Public consumer API ─── */
function publicGet(sceneKey, bannerId, lang){
  if(!data) load();
  var sc = findScene(sceneKey); if(!sc) return null;
  var bn = findBanner(sc, bannerId); if(!bn) return null;
  var L = lang || activeLang;
  var t = (bn.text&&bn.text[L])||(bn.text&&bn.text.en)||{title:'',body:''};
  var a = (bn.audio&&bn.audio[L])||(bn.audio&&bn.audio.en)||'';
  var ac = (bn.audioChain&&bn.audioChain[L])||(bn.audioChain&&bn.audioChain.en)||'';
  return { title:t.title, body:t.body, html:t.body, audio:a, audioUrl:audioUrl(a), audioChain:ac, audioChainUrl:audioUrl(ac), trigger:bn.trigger, panorama:bn.panorama, template:bn.template, position:bn.position };
}

/* ═══════════════════════════════════════════════
   Rendering
   ═══════════════════════════════════════════════ */
function mount(){
  if(!data) load();
  var root = document.getElementById('journeyContentMount');
  if(!root) return;
  root.innerHTML = shell();
  bindShell();
  renderLangBar();
  renderSceneList();
  renderMain();
  renderStatus();
}

function shell(){
  return ''+
  '<div class="jc-toolbar">'+
    '<div class="jc-langs" id="jcLangs"></div>'+
    '<div class="jc-view-tabs">'+
      '<button class="jc-vt'+(activeView==='editor'?' active':'')+'" data-jc="view" data-v="editor"><i class="fas fa-edit"></i> Editor</button>'+
      '<button class="jc-vt'+(activeView==='panoramas'?' active':'')+'" data-jc="view" data-v="panoramas"><i class="fas fa-images"></i> Panoramas</button>'+
    '</div>'+
    '<div class="jc-actions">'+
      '<span id="jcFlash" class="jc-flash"></span>'+
      '<span id="jcStatus" class="jc-status"></span>'+
      '<button class="btn btn-sm" data-jc="export-json"><i class="fas fa-download"></i> Export</button>'+
      '<button class="btn btn-sm" data-jc="import-json"><i class="fas fa-upload"></i> Import</button>'+
      '<input type="file" id="jcImportFile" accept=".json" style="display:none">'+
      '<button class="btn btn-sm" data-jc="resync-all" title="Pull latest text/audio from factory defaults (keeps your template + position)"><i class="fas fa-sync"></i> Re-sync</button>'+
      '<button class="btn btn-sm" data-jc="reset"><i class="fas fa-undo"></i> Reset</button>'+
      '<button class="btn btn-sm btn-primary" data-jc="save"><i class="fas fa-save"></i> Save</button>'+
    '</div>'+
  '</div>'+
  '<div class="jc-grid">'+
    '<aside class="jc-sidebar"><div class="jc-side-head">Scenes</div><div id="jcSceneList"></div></aside>'+
    '<section class="jc-main" id="jcMain"></section>'+
  '</div>'+
  styleBlock();
}

function styleBlock(){
  return '<style>'+
  '.jc-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 0 12px;border-bottom:1px solid var(--border);margin-bottom:14px}'+
  '.jc-langs{display:flex;gap:5px;align-items:center;flex-wrap:wrap}'+
  '.jc-lang-pill{padding:3px 8px;border-radius:14px;background:var(--bg-secondary);border:1px solid var(--border);cursor:pointer;font-size:.7rem;color:var(--text-secondary);display:inline-flex;align-items:center;gap:5px;line-height:1.4}'+
  '.jc-lang-pill.active{background:var(--gold);color:#1a1a2e;border-color:var(--gold);font-weight:600}'+
  '.jc-lang-pill .x{opacity:.5;cursor:pointer;padding:0 2px}'+
  '.jc-lang-pill .x:hover{opacity:1;color:#ff6b78}'+
  '.jc-lang-add{background:transparent;border:1px dashed var(--border);color:var(--text-muted)}'+
  '.jc-view-tabs{display:flex;gap:4px;background:var(--bg-secondary);padding:3px;border-radius:7px;border:1px solid var(--border)}'+
  '.jc-vt{background:transparent;border:none;color:var(--text-muted);padding:4px 12px;border-radius:5px;font-size:.72rem;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-weight:500}'+
  '.jc-vt.active{background:var(--gold);color:#1a1a2e;font-weight:600}'+
  '.jc-actions{display:flex;gap:5px;align-items:center;flex-wrap:wrap}'+
  '.jc-actions .btn,#journeyContentMount .jc-actions button{padding:4px 9px !important;font-size:.7rem !important;line-height:1.3 !important;border-radius:5px !important;height:auto !important}'+
  '.jc-flash{font-size:.72rem;opacity:0;transition:opacity .25s;padding:3px 8px;border-radius:5px}'+
  '.jc-status{font-size:.7rem;color:var(--text-muted)}'+
  '.jc-grid{display:grid;grid-template-columns:240px 1fr;gap:14px;align-items:start}'+
  '.jc-sidebar{background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:8px;max-height:82vh;overflow-y:auto;position:sticky;top:10px}'+
  '.jc-side-head{font-size:.65rem;text-transform:uppercase;letter-spacing:1.4px;color:var(--text-muted);padding:5px 8px 8px;font-weight:600}'+
  '.jc-scene-row{padding:7px 9px;border-radius:7px;cursor:pointer;display:flex;gap:7px;align-items:center;font-size:.78rem;color:var(--text-secondary);margin-bottom:2px}'+
  '.jc-day-hdr{display:flex;align-items:center;gap:8px;margin:14px 4px 6px;padding:6px 8px;border-radius:6px;background:linear-gradient(90deg,rgba(184,148,31,.10),rgba(184,148,31,.02));border-left:3px solid var(--gold);font-weight:600}'+
  '.jc-day-hdr:first-child{margin-top:4px}'+
  '.jc-day-hdr .jc-day-tag{font-size:.58rem;text-transform:uppercase;letter-spacing:.6px;color:var(--gold-dark);background:var(--gold-glow);padding:2px 7px;border-radius:10px;font-weight:700;flex-shrink:0}'+
  '.jc-day-hdr .jc-day-label{font-size:.74rem;color:var(--text-primary);line-height:1.25}'+
  '.jc-scene-row:hover{background:rgba(15,23,42,0.04)}'+
  '.jc-scene-row.active{background:rgba(212,175,55,0.14);color:var(--text-primary);border-left:3px solid var(--gold);padding-left:6px}'+
  '.jc-scene-row .step-n{display:inline-flex;width:20px;height:20px;align-items:center;justify-content:center;background:var(--bg-input);border-radius:50%;font-size:.65rem;color:var(--gold);font-weight:700;flex-shrink:0}'+
  '.jc-scene-row .ctx-tag{margin-left:auto;font-size:.58rem;text-transform:uppercase;color:var(--text-muted);background:var(--bg-input);padding:1px 5px;border-radius:3px}'+
  '.jc-main{background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:14px;min-height:400px}'+
  '.jc-editor-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;padding-bottom:10px;border-bottom:1px solid var(--border);margin-bottom:12px}'+
  '.jc-editor-head h3{margin:0 0 3px;font-size:.98rem}'+
  '.jc-editor-head .meta{font-size:.66rem;color:var(--text-muted);font-family:Monaco,monospace}'+
  '.jc-editor-head .btn{padding:4px 9px !important;font-size:.7rem !important}'+
  '.jc-banner{background:var(--bg-tertiary);border:1px solid var(--border);border-radius:9px;padding:11px;margin-bottom:11px}'+
  '.jc-banner-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}'+
  '.jc-banner-label{font-weight:600;font-size:.82rem;color:var(--text-primary)}'+
  '.jc-banner-trig{display:inline-block;font-size:.6rem;text-transform:uppercase;letter-spacing:.8px;padding:1px 6px;border-radius:3px;background:rgba(212,175,55,0.14);color:var(--gold);margin-left:6px;font-weight:600}'+
  '.jc-banner-pano{font-family:Monaco,monospace;font-size:.65rem;color:var(--text-muted);margin-top:2px;word-break:break-all}'+
  '.jc-banner-actions{display:flex;gap:4px}'+
  '.jc-banner-actions .btn{padding:3px 7px !important;font-size:.7rem !important;line-height:1.2 !important;min-width:0}'+
  '.jc-row{display:grid;grid-template-columns:108px 1fr;gap:9px;margin-bottom:8px;align-items:start}'+
  '.jc-row label{font-size:.7rem;color:var(--text-muted);font-weight:600;padding-top:6px}'+
  '.jc-row input[type=text],.jc-row textarea,.jc-row select{width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:5px;color:var(--text-primary);padding:6px 9px;font-size:.8rem;font-family:inherit}'+
  '.jc-row textarea{min-height:90px;resize:vertical;line-height:1.5;font-family:Menlo,Monaco,monospace;font-size:.76rem}'+
  '.jc-row input:focus,.jc-row textarea:focus,.jc-row select:focus{outline:none;border-color:var(--gold)}'+
  '.jc-audio-grp{display:flex;gap:5px;align-items:center;flex-wrap:wrap}'+
  '.jc-audio-grp input{flex:1;min-width:160px}'+
  '.jc-audio-grp button{padding:4px 8px;font-size:.68rem;background:var(--bg-input);border:1px solid var(--border);color:var(--text-secondary);border-radius:5px;cursor:pointer;line-height:1.3}'+
  '.jc-audio-grp button:hover{border-color:var(--gold);color:var(--gold)}'+
  '.jc-empty-lang{padding:10px;background:rgba(212,175,55,0.06);border:1px dashed rgba(212,175,55,0.3);border-radius:5px;font-size:.74rem;color:var(--text-muted);text-align:center;margin-bottom:9px}'+
  '.jc-empty-lang button{background:var(--gold);color:#1a1a2e;border:none;border-radius:4px;padding:4px 10px;font-size:.7rem;font-weight:600;cursor:pointer;margin-left:6px}'+
  /* Template chooser */
  '.jc-tpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px;margin-top:4px}'+
  '.jc-tpl-card{background:var(--bg-input);border:2px solid var(--border);border-radius:6px;padding:7px;cursor:pointer;transition:border-color .12s;text-align:center}'+
  '.jc-tpl-card:hover{border-color:var(--gold)}'+
  '.jc-tpl-card.active{border-color:var(--gold);background:rgba(212,175,55,.08)}'+
  '.jc-tpl-card .tpl-name{font-size:.72rem;color:var(--text-primary);font-weight:600;margin-top:4px}'+
  '.jc-tpl-card .tpl-cat{font-size:.58rem;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px}'+
  '.jc-tpl-thumb{height:40px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:600}'+
  /* Drag preview viewport */
  '.jc-preview-wrap{margin-top:14px;border-top:1px dashed var(--border);padding-top:12px}'+
  '.jc-preview-head{font-size:.65rem;text-transform:uppercase;letter-spacing:1.2px;color:var(--text-muted);margin-bottom:8px;display:flex;align-items:center;gap:6px;justify-content:space-between}'+
  '.jc-preview-head::before{content:"◉";color:var(--gold);margin-right:5px}'+
  '.jc-pv-actions{display:flex;gap:4px}'+
  '.jc-pv-actions button{background:var(--bg-input);border:1px solid var(--border);color:var(--text-muted);padding:2px 7px;border-radius:4px;font-size:.65rem;cursor:pointer}'+
  '.jc-pv-actions button:hover{border-color:var(--gold);color:var(--gold)}'+
  '.jc-pv-viewport{position:relative;width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,#0a1525 0%,#1a2a3f 50%,#0a1525 100%);border:1px solid var(--border);border-radius:8px;overflow:hidden;background-image:radial-gradient(circle at 30% 40%,rgba(212,175,55,.08) 0,transparent 40%),radial-gradient(circle at 70% 60%,rgba(255,217,138,.06) 0,transparent 40%),linear-gradient(135deg,#0a1525 0%,#1a2a3f 50%,#0a1525 100%)}'+
  '.jc-pv-viewport::before{content:"VR PANORAMA PREVIEW";position:absolute;top:6px;left:10px;font-size:.55rem;letter-spacing:2px;color:rgba(255,255,255,.25);font-family:Monaco,monospace;z-index:1}'+
  '.jc-pv-viewport::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.4) 100%);pointer-events:none}'+
  '.jc-pv-banner{position:absolute;cursor:move;user-select:none;z-index:5;transform:translate(-50%,-50%);max-width:80%;max-height:90%;overflow:hidden}'+
  '.jc-pv-banner.dragging{opacity:.85;transition:none}'+
  '.jc-pv-banner > *{transform-origin:center;pointer-events:none}'+
  '.jc-pv-snap-hint{position:absolute;top:6px;right:10px;font-size:.6rem;color:rgba(255,217,138,.6);font-family:Monaco,monospace;z-index:2;pointer-events:none}'+
  '.jc-pv-pos-readout{margin-top:6px;font-size:.65rem;color:var(--text-muted);font-family:Monaco,monospace;display:flex;gap:14px;flex-wrap:wrap;align-items:center}'+
  '.jc-pv-pos-readout button{background:var(--bg-input);border:1px solid var(--border);color:var(--text-muted);padding:2px 7px;border-radius:4px;font-size:.62rem;cursor:pointer;margin-right:3px}'+
  '.jc-pv-pos-readout button.act{background:var(--gold);color:#1a1a2e;border-color:var(--gold);font-weight:600}'+
  '.jc-pv-empty{padding:18px;text-align:center;color:var(--text-muted);font-size:.78rem;font-style:italic;background:var(--bg-input);border:1px dashed var(--border);border-radius:8px}'+
  /* Panorama view */
  '.jc-pano-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-top:8px}'+
  '.jc-pano-card{background:var(--bg-tertiary);border:1px solid var(--border);border-radius:9px;padding:10px;cursor:pointer;transition:border-color .15s}'+
  '.jc-pano-card:hover{border-color:var(--gold)}'+
  '.jc-pano-thumb{position:relative;width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,#1a2a3f,#0a1525);border-radius:6px;overflow:hidden;background-image:radial-gradient(circle at 30% 50%,rgba(212,175,55,.18) 0,transparent 40%),radial-gradient(circle at 70% 70%,rgba(255,217,138,.12) 0,transparent 40%),linear-gradient(135deg,#1a2a3f,#0a1525);display:flex;align-items:center;justify-content:center;color:rgba(255,217,138,.4);font-size:1.4rem}'+
  '.jc-pano-thumb .pano-marker{position:absolute;width:14px;height:14px;border-radius:50%;background:#FFD98A;border:2px solid #fff;box-shadow:0 0 12px rgba(255,217,138,.8);transform:translate(-50%,-50%);z-index:2}'+
  '.jc-pano-thumb .pano-marker::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1px solid rgba(255,217,138,.5);animation:jcPulse 2s ease-out infinite}'+
  '@keyframes jcPulse{0%{transform:scale(1);opacity:1}100%{transform:scale(2);opacity:0}}'+
  '.jc-pano-id{font-family:Monaco,monospace;font-size:.6rem;color:var(--text-muted);margin-top:6px;word-break:break-all;line-height:1.3}'+
  '.jc-pano-banners{margin-top:6px;font-size:.7rem;color:var(--text-secondary)}'+
  '.jc-pano-banners .pb-row{display:flex;justify-content:space-between;align-items:center;padding:4px 6px;border-radius:4px;margin-bottom:2px;background:var(--bg-primary)}'+
  '.jc-pano-banners .pb-row:hover{background:rgba(212,175,55,.08)}'+
  '.jc-pano-banners small{color:var(--text-muted);font-size:.62rem}'+
  '.jc-pano-noban{padding:10px;text-align:center;font-size:.7rem;color:var(--text-muted);font-style:italic}'+
  '@media (max-width:900px){.jc-grid{grid-template-columns:1fr}.jc-sidebar{position:static;max-height:none}.jc-row{grid-template-columns:1fr}}'+
  '</style>';
}

function bindShell(){
  var root = document.getElementById('journeyContentMount');
  root.addEventListener('click', function(e){
    var btn = e.target.closest('[data-jc]'); if(!btn) return;
    var act = btn.getAttribute('data-jc');
    if(act==='save'){ save(); }
    else if(act==='reset'){ if(confirm('Reset all journey content to factory defaults? This cannot be undone.')){ data=JSON.parse(JSON.stringify(DEFAULT_DATA)); save(true); mount(); flash('Reset to defaults'); } }
    else if(act==='export-json'){ exportJSON(); }
    else if(act==='import-json'){ document.getElementById('jcImportFile').click(); }
    else if(act==='view'){ activeView = btn.getAttribute('data-v'); mount(); }
    else if(act==='add-lang'){ addLanguagePrompt(); }
    else if(act==='set-lang'){ activeLang = btn.getAttribute('data-code'); renderLangBar(); renderMain(); }
    else if(act==='del-lang'){ removeLanguage(btn.getAttribute('data-code')); }
    else if(act==='set-scene'){ activeSceneKey = btn.getAttribute('data-key'); renderSceneList(); renderMain(); }
    else if(act==='add-banner'){ addBanner(); }
    else if(act==='del-banner'){ delBanner(btn.getAttribute('data-id')); }
    else if(act==='dup-banner'){ dupBanner(btn.getAttribute('data-id')); }
    else if(act==='play-audio'){ playPreview(btn.getAttribute('data-file')); }
    else if(act==='upload-audio'){ uploadAudioFor(btn.getAttribute('data-id'), btn.getAttribute('data-field')); }
    else if(act==='clear-audio'){ clearAudioFor(btn.getAttribute('data-id'), btn.getAttribute('data-field')); }
    else if(act==='seed-lang-banner'){ seedLangForBanner(btn.getAttribute('data-id')); }
    else if(act==='set-tpl'){ setBannerTpl(btn.getAttribute('data-id'), btn.getAttribute('data-tpl')); }
    else if(act==='snap-pos'){ snapBannerPosition(btn.getAttribute('data-id'), btn.getAttribute('data-pos')); }
    else if(act==='reset-pos'){ resetBannerPosition(btn.getAttribute('data-id')); }
    else if(act==='focus-banner'){ focusBanner(btn.getAttribute('data-id')); }
    else if(act==='reset-banner'){
      var bid = btn.getAttribute('data-id');
      if(confirm('Reset this banner\u2019s text and audio to factory defaults? Your template + position will be kept.')){
        if(resetBannerToDefault(activeSceneKey, bid)){ markDirty(); save(); renderMain(); flash('Banner reset to default'); }
        else flash('No default found for this banner', true);
      }
    }
    else if(act==='resync-all'){
      if(confirm('Re-sync ALL banner text + audio from the latest factory defaults?\n\nThis pulls in updated content from the live VR tour. Your template + position customisations are kept.')){
        resyncFromDefaults(); data.seedVersion = SEED_VERSION; save(); mount(); flash('Re-synced from defaults');
      }
    }
  });
  root.addEventListener('input', function(e){
    var el = e.target.closest('[data-jc-field]'); if(!el) return;
    handleFieldEdit(el);
  });
  root.querySelector('#jcImportFile').addEventListener('change', function(e){
    var f = e.target.files[0]; if(!f) return;
    var r = new FileReader();
    r.onload = function(){ try{ var p=JSON.parse(r.result); if(!p.scenes||!p.languages) throw new Error('Invalid'); data=p; save(true); mount(); flash('Imported successfully'); }catch(err){ flash('Import failed: '+err.message,true); } };
    r.readAsText(f);
    e.target.value='';
  });
}

function renderStatus(){
  var el = document.getElementById('jcStatus'); if(!el) return;
  el.textContent = dirty ? '● Unsaved changes' : 'All changes saved';
  el.style.color = dirty ? '#ffb84a' : 'var(--text-muted)';
}

function renderLangBar(){
  var c = document.getElementById('jcLangs');
  c.innerHTML = data.languages.map(function(l){
    var isActive = l.code===activeLang;
    var del = data.languages.length>1 ? '<span class="x" data-jc="del-lang" data-code="'+esc(l.code)+'" title="Remove language">×</span>' : '';
    return '<span class="jc-lang-pill'+(isActive?' active':'')+'" data-jc="set-lang" data-code="'+esc(l.code)+'">'+esc(l.name)+' <small style="opacity:.6">('+esc(l.code)+')</small>'+(l.isDefault?' ★':'')+del+'</span>';
  }).join('') + '<button class="jc-lang-pill jc-lang-add" data-jc="add-lang"><i class="fas fa-plus"></i> Add language</button>';
}

function dayBucketFor(step){
  // Cluster scenes by the day of the Hajj experience they belong to
  if(step<=5)  return {key:'umrah',  label:'Pre-Hajj · Umrah',          tag:'Before 8th'};
  if(step===6) return {key:'d8',     label:'8th Dhul-Hijjah · Yawm at-Tarwiyah', tag:'Day 8'};
  if(step===7 || step===8) return {key:'d9', label:'9th Dhul-Hijjah · Day of Arafah & Muzdalifah', tag:'Day 9'};
  if(step>=9  && step<=12) return {key:'d10', label:'10th Dhul-Hijjah · Yawm an-Nahr',   tag:'Day 10'};
  if(step===13) return {key:'d11',  label:'11th Dhul-Hijjah · Days of Tashreeq', tag:'Day 11'};
  if(step===14 || step===15) return {key:'d12', label:'12th Dhul-Hijjah · Days of Tashreeq', tag:'Day 12'};
  if(step===16) return {key:'farewell', label:'Departure · Tawaf al-Wida’', tag:'Final'};
  return {key:'other', label:'Other', tag:''};
}

function renderSceneList(){
  var c = document.getElementById('jcSceneList');
  // Sort scenes by VR-experience step number
  var ordered = data.scenes.slice().sort(function(a,b){ return (a.step||999)-(b.step||999); });
  var html=''; var lastDay=null;
  ordered.forEach(function(s){
    var d = dayBucketFor(s.step||0);
    if(d.key!==lastDay){
      html += '<div class="jc-day-hdr" data-day="'+esc(d.key)+'"><span class="jc-day-tag">'+esc(d.tag)+'</span><span class="jc-day-label">'+esc(d.label)+'</span></div>';
      lastDay = d.key;
    }
    var n = s.banners.length;
    html += '<div class="jc-scene-row'+(s.key===activeSceneKey?' active':'')+'" data-jc="set-scene" data-key="'+esc(s.key)+'">'+
      '<span class="step-n">'+s.step+'</span>'+
      '<span style="flex:1;min-width:0">'+esc(s.title)+'<div style="font-size:.62rem;color:var(--text-muted);margin-top:2px">'+n+' banner'+(n!==1?'s':'')+(s.panoramas&&s.panoramas.length?' · '+s.panoramas.length+' pano':'')+'</div></span>'+
      (s.context?'<span class="ctx-tag">'+esc(s.context)+'</span>':'')+
    '</div>';
  });
  c.innerHTML = html;
}

function renderMain(){
  if(activeView==='panoramas') renderPanoramaView();
  else renderEditor();
}

function renderEditor(){
  var sc = findScene(activeSceneKey);
  var c = document.getElementById('jcMain');
  if(!sc){ c.innerHTML = '<p style="color:var(--text-muted)">No scene selected.</p>'; return; }
  c.innerHTML =
    '<div class="jc-editor-head">'+
      '<div><h3>Step '+sc.step+' — '+esc(sc.title.replace(/^Step \d+ — /,''))+'</h3>'+
      '<div class="meta">'+esc(sc.file)+(sc.context?' &nbsp;·&nbsp; <code>?context='+esc(sc.context)+'</code>':'')+'</div></div>'+
      '<div><button class="btn btn-sm btn-primary" data-jc="add-banner"><i class="fas fa-plus"></i> Add banner</button></div>'+
    '</div>'+
    sc.banners.map(bannerCard).join('')+
    (sc.banners.length===0?'<div style="text-align:center;padding:30px;color:var(--text-muted)">No banners yet for this scene.</div>':'');
  // Inject CSS for all templates used + bind drag handlers
  sc.banners.forEach(function(b){ injectTplCss(b.template); });
  sc.banners.forEach(function(b){ bindDrag(b.id); });
}

function bannerCard(b){
  var lang = activeLang;
  var hasLang = b.text && b.text[lang];
  var t = hasLang ? b.text[lang] : {title:'',body:''};
  var a = (b.audio&&b.audio[lang])||'';
  var ac = (b.audioChain&&b.audioChain[lang])||'';
  var emptyHint = !hasLang ?
    '<div class="jc-empty-lang">No <strong>'+esc(lang)+'</strong> translation yet.<button data-jc="seed-lang-banner" data-id="'+esc(b.id)+'">Add '+esc(lang)+' fields</button></div>' : '';
  var triggerLabel = b.trigger||'';
  var panoLine = b.panorama ? '<div class="jc-banner-pano">'+esc(b.panorama)+'</div>' : '';
  return ''+
  '<div class="jc-banner" data-bid="'+esc(b.id)+'" id="jc-banner-'+esc(b.id)+'">'+
    '<div class="jc-banner-head">'+
      '<div><span class="jc-banner-label">'+esc(b.label||b.id)+'</span><span class="jc-banner-trig">'+esc(triggerLabel)+'</span>'+panoLine+'</div>'+
      '<div class="jc-banner-actions">'+
        '<button class="btn btn-sm btn-outline" data-jc="reset-banner" data-id="'+esc(b.id)+'" title="Reset text/audio to factory default"><i class="fas fa-undo"></i></button>'+
        '<button class="btn btn-sm btn-outline" data-jc="dup-banner" data-id="'+esc(b.id)+'" title="Duplicate"><i class="fas fa-copy"></i></button>'+
        '<button class="btn btn-sm btn-outline" data-jc="del-banner" data-id="'+esc(b.id)+'" title="Delete" style="color:#ff6b78"><i class="fas fa-trash"></i></button>'+
      '</div>'+
    '</div>'+
    emptyHint+
    '<div class="jc-row"><label>Label</label><input type="text" data-jc-field="label" data-id="'+esc(b.id)+'" value="'+esc(b.label||'')+'"></div>'+
    (b.trigger==='panorama' ? '<div class="jc-row"><label>Panorama ID</label><input type="text" data-jc-field="panorama" data-id="'+esc(b.id)+'" value="'+esc(b.panorama||'')+'" placeholder="panorama_XXXXXX_..."></div>' : '')+
    '<div class="jc-row"><label>Title <small style="color:var(--gold)">['+esc(lang)+']</small></label><input type="text" data-jc-field="title" data-id="'+esc(b.id)+'" data-lang="'+esc(lang)+'" value="'+esc(t.title)+'"'+(hasLang?'':' disabled')+'></div>'+
    '<div class="jc-row"><label>Body HTML <small style="color:var(--gold)">['+esc(lang)+']</small></label><textarea data-jc-field="body" data-id="'+esc(b.id)+'" data-lang="'+esc(lang)+'"'+(hasLang?'':' disabled')+' placeholder="HTML allowed: &lt;p class=\'bb\'&gt;…&lt;/p&gt;">'+esc(t.body)+'</textarea></div>'+
    '<div class="jc-row"><label>Audio file <small style="color:var(--gold)">['+esc(lang)+']</small></label>'+
      '<div class="jc-audio-grp">'+
        '<input type="text" data-jc-field="audio" data-id="'+esc(b.id)+'" data-lang="'+esc(lang)+'" value="'+esc(a)+'" placeholder="filename.mp3 or full URL"'+(hasLang?'':' disabled')+'>'+
        '<button data-jc="upload-audio" data-id="'+esc(b.id)+'" data-field="audio" title="Upload"><i class="fas fa-upload"></i></button>'+
        (a?'<button data-jc="play-audio" data-file="'+esc(a)+'" title="Preview"><i class="fas fa-play"></i></button>':'')+
        (a?'<button data-jc="clear-audio" data-id="'+esc(b.id)+'" data-field="audio" title="Remove audio file (keeps text)" style="color:#ff6b78"><i class="fas fa-trash"></i></button>':'')+
      '</div>'+
    '</div>'+
    (b.trigger==='guide-screen-1' || b.audioChain ?
      '<div class="jc-row"><label>Chained audio</label>'+
      '<div class="jc-audio-grp">'+
        '<input type="text" data-jc-field="audioChain" data-id="'+esc(b.id)+'" data-lang="'+esc(lang)+'" value="'+esc(ac)+'" placeholder="(optional) follow-up audio file">'+
        '<button data-jc="upload-audio" data-id="'+esc(b.id)+'" data-field="audioChain" title="Upload"><i class="fas fa-upload"></i></button>'+
        (ac?'<button data-jc="play-audio" data-file="'+esc(ac)+'" title="Preview"><i class="fas fa-play"></i></button>':'')+
        (ac?'<button data-jc="clear-audio" data-id="'+esc(b.id)+'" data-field="audioChain" title="Remove chained audio file" style="color:#ff6b78"><i class="fas fa-trash"></i></button>':'')+
      '</div></div>' : '')+
    /* Template chooser */
    '<div class="jc-row"><label>Template</label>'+
      '<div class="jc-tpl-grid">'+
        Object.keys(BANNER_TEMPLATES).map(function(tk){
          var tpl=BANNER_TEMPLATES[tk]; var act=b.template===tk?' active':'';
          var thumbBg = tplThumbBg(tk);
          return '<div class="jc-tpl-card'+act+'" data-jc="set-tpl" data-id="'+esc(b.id)+'" data-tpl="'+esc(tk)+'" title="'+esc(tpl.desc)+'">'+
            '<div class="jc-tpl-thumb" style="'+thumbBg+'">Aa</div>'+
            '<div class="tpl-name">'+esc(tpl.name)+'</div>'+
            '<div class="tpl-cat">'+esc(tpl.category)+' · '+esc(tpl.size)+'</div>'+
          '</div>';
        }).join('')+
      '</div>'+
    '</div>'+
    /* Drag preview */
    '<div class="jc-preview-wrap">'+
      '<div class="jc-preview-head">Live preview — drag the banner to reposition'+
        '<div class="jc-pv-actions"><button data-jc="reset-pos" data-id="'+esc(b.id)+'">↺ Reset position</button></div>'+
      '</div>'+
      renderDragPreview(b, t, hasLang)+
      '<div class="jc-pv-pos-readout" id="jc-pos-'+esc(b.id)+'">'+positionReadout(b)+'</div>'+
    '</div>'+
  '</div>';
}

function tplThumbBg(tk){
  // Cheap inline preview color sample
  var map = {
    'classic-gold':'background:linear-gradient(135deg,#f5e9c8,#ede0b8);color:#8B6914;border:2px double #C9A84C',
    'parchment-frame':'background:radial-gradient(ellipse at center,#f7ecd0,#d4be7d);color:#7a4a14;font-family:Georgia,serif',
    'minimal-glass':'background:rgba(180,200,220,.3);color:#FFD98A;backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.4)',
    'ornate-arabesque':'background:#0d1421;color:#D4AF37;border:1px solid #D4AF37',
    'royal-emerald':'background:linear-gradient(135deg,#0a3a2a,#0e5238);color:#FFD98A;border:1px solid #D4AF37',
    'compact-pill':'background:rgba(20,12,4,.92);color:#F4E4BC;border-radius:999px;border:1px solid rgba(201,168,76,.55)',
    'hero-large':'background:linear-gradient(160deg,#1a1a2e,#0f3460);color:#D4AF37;border:2px solid #D4AF37',
    'side-card':'background:linear-gradient(180deg,#fffbe9,#f5edd0);color:#8B6914;border-left:3px solid #C9A84C',
    'midnight-blue':'background:radial-gradient(ellipse at top,#1e3a5f,#0d1b2a);color:#FFD98A;border:1px solid #D4AF37',
    'sunrise-gold':'background:linear-gradient(135deg,#FFE5B4,#E8B860);color:#8B4513;border:1px solid #B8941F',
    'ihram-guide':'background:radial-gradient(circle at top,#1a2438,#0a0e1a);color:#D4AF37;border:1px solid #D4AF37'
  };
  return map[tk]||'background:#222';
}

function renderDragPreview(b, t, hasLang){
  if(!hasLang || (!t.title && !t.body)){
    return '<div class="jc-pv-empty">Add title or body text to see a live preview.</div>';
  }
  var tplCls = 'tpl-'+(b.template||'classic-gold');
  var pos = b.position||{x:50,y:50};
  return '<div class="jc-pv-viewport" data-pv-id="'+esc(b.id)+'">'+
    '<div class="jc-pv-snap-hint">Drag to reposition</div>'+
    '<div class="jc-pv-banner '+tplCls+'" data-pv-banner="'+esc(b.id)+'" style="left:'+pos.x+'%;top:'+pos.y+'%">'+
      (t.title?'<h3>'+t.title+'</h3>':'')+
      '<div class="sep"></div>'+
      (t.body||'')+
    '</div>'+
  '</div>';
}

function positionReadout(b){
  var pos = b.position||{x:50,y:50,align:'center'};
  var presets = [
    {k:'top-left',label:'TL'},{k:'top',label:'T'},{k:'top-right',label:'TR'},
    {k:'left',label:'L'},{k:'center',label:'C'},{k:'right',label:'R'},
    {k:'bottom-left',label:'BL'},{k:'bottom',label:'B'},{k:'bottom-right',label:'BR'}
  ];
  return '<span>x: '+Math.round(pos.x)+'%, y: '+Math.round(pos.y)+'%</span>'+
    '<span>Snap: '+presets.map(function(p){
      return '<button data-jc="snap-pos" data-id="'+esc(b.id)+'" data-pos="'+p.k+'">'+p.label+'</button>';
    }).join('')+'</span>';
}

/* ─── Drag positioning ─── */
function bindDrag(bannerId){
  var vp = document.querySelector('[data-pv-id="'+bannerId+'"]'); if(!vp) return;
  var bn = vp.querySelector('[data-pv-banner="'+bannerId+'"]'); if(!bn) return;
  var dragging = false, startX=0, startY=0, startLeft=50, startTop=50;
  function onDown(e){
    dragging = true;
    bn.classList.add('dragging');
    var pt = e.touches?e.touches[0]:e;
    startX = pt.clientX; startY = pt.clientY;
    var rect = vp.getBoundingClientRect();
    var bRect = bn.getBoundingClientRect();
    startLeft = ((bRect.left + bRect.width/2 - rect.left)/rect.width)*100;
    startTop = ((bRect.top + bRect.height/2 - rect.top)/rect.height)*100;
    e.preventDefault();
  }
  function onMove(e){
    if(!dragging) return;
    var pt = e.touches?e.touches[0]:e;
    var rect = vp.getBoundingClientRect();
    var dx = ((pt.clientX-startX)/rect.width)*100;
    var dy = ((pt.clientY-startY)/rect.height)*100;
    var nx = Math.max(5,Math.min(95, startLeft+dx));
    var ny = Math.max(5,Math.min(95, startTop+dy));
    bn.style.left = nx+'%';
    bn.style.top = ny+'%';
    var sc = findScene(activeSceneKey); if(!sc) return;
    var b = findBanner(sc, bannerId); if(!b) return;
    b.position = b.position||{};
    b.position.x = nx; b.position.y = ny;
    var ro = document.getElementById('jc-pos-'+bannerId); if(ro) ro.innerHTML = positionReadout(b);
  }
  function onUp(){
    if(!dragging) return;
    dragging = false; bn.classList.remove('dragging');
    markDirty();
  }
  bn.addEventListener('mousedown', onDown);
  bn.addEventListener('touchstart', onDown, {passive:false});
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, {passive:false});
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchend', onUp);
}

function snapBannerPosition(bannerId, posKey){
  var sc = findScene(activeSceneKey); var b = findBanner(sc, bannerId); if(!b) return;
  var map = {
    'top-left':{x:18,y:15},'top':{x:50,y:15},'top-right':{x:82,y:15},
    'left':{x:18,y:50},'center':{x:50,y:50},'right':{x:82,y:50},
    'bottom-left':{x:18,y:85},'bottom':{x:50,y:85},'bottom-right':{x:82,y:85}
  };
  var p = map[posKey]; if(!p) return;
  b.position = b.position||{}; b.position.x=p.x; b.position.y=p.y; b.position.align=posKey;
  markDirty();
  // Update DOM directly
  var bn = document.querySelector('[data-pv-banner="'+bannerId+'"]');
  if(bn){ bn.style.left=p.x+'%'; bn.style.top=p.y+'%'; }
  var ro = document.getElementById('jc-pos-'+bannerId); if(ro) ro.innerHTML = positionReadout(b);
}

function resetBannerPosition(bannerId){
  snapBannerPosition(bannerId, 'center');
}

/* ─── Template change ─── */
function setBannerTpl(bannerId, tplId){
  var sc = findScene(activeSceneKey); var b = findBanner(sc, bannerId); if(!b||!BANNER_TEMPLATES[tplId]) return;
  b.template = tplId;
  injectTplCss(tplId);
  markDirty();
  // Re-render just this card to update template chooser highlight + preview class
  var card = document.getElementById('jc-banner-'+bannerId);
  if(card){
    var lang=activeLang;
    var hasLang = b.text && b.text[lang];
    var t = hasLang ? b.text[lang] : {title:'',body:''};
    // Update active chip
    card.querySelectorAll('.jc-tpl-card').forEach(function(el){
      el.classList.toggle('active', el.getAttribute('data-tpl')===tplId);
    });
    // Re-render preview
    var pvWrap = card.querySelector('.jc-preview-wrap');
    if(pvWrap){
      pvWrap.innerHTML = '<div class="jc-preview-head">Live preview — drag the banner to reposition'+
        '<div class="jc-pv-actions"><button data-jc="reset-pos" data-id="'+esc(b.id)+'">↺ Reset position</button></div>'+
        '</div>'+
        renderDragPreview(b,t,hasLang)+
        '<div class="jc-pv-pos-readout" id="jc-pos-'+esc(b.id)+'">'+positionReadout(b)+'</div>';
      bindDrag(b.id);
    }
  }
}

/* ─── Edit handlers ─── */
function handleFieldEdit(el){
  var sc = findScene(activeSceneKey); if(!sc) return;
  var b = findBanner(sc, el.getAttribute('data-id')); if(!b) return;
  var field = el.getAttribute('data-jc-field');
  var lang = el.getAttribute('data-lang');
  if(field==='label'){ b.label = el.value; }
  else if(field==='panorama'){ b.panorama = el.value; }
  else if(field==='title'||field==='body'){
    b.text = b.text||{}; b.text[lang] = b.text[lang]||{title:'',body:''};
    b.text[lang][field] = el.value;
  }
  else if(field==='audio'){ b.audio = b.audio||{}; b.audio[lang] = el.value; }
  else if(field==='audioChain'){ b.audioChain = b.audioChain||{}; b.audioChain[lang] = el.value; }
  markDirty();
  // Live preview update
  if(field==='title'||field==='body'||field==='label'){
    var card = document.getElementById('jc-banner-'+b.id); if(!card) return;
    if(field==='label'){
      var lab = card.querySelector('.jc-banner-label'); if(lab) lab.textContent = b.label||b.id;
      return;
    }
    var bn = card.querySelector('[data-pv-banner="'+b.id+'"]'); if(!bn) return;
    var t2 = (b.text&&b.text[lang])||{title:'',body:''};
    bn.innerHTML = (t2.title?'<h3>'+t2.title+'</h3>':'')+'<div class="sep"></div>'+(t2.body||'');
  }
}

function addBanner(){
  var sc = findScene(activeSceneKey); if(!sc) return;
  var id = 'b-'+Date.now().toString(36);
  var newBan = defB({ id:id, trigger:'panorama', panorama:'', label:'New banner',
    text:{}, audio:{} });
  newBan.text[activeLang] = {title:'New banner',body:'<p class="bb">Edit this body text.</p>'};
  newBan.audio[activeLang] = '';
  sc.banners.push(newBan);
  markDirty(); renderEditor(); renderSceneList();
}
function delBanner(id){
  if(!confirm('Delete this banner? This cannot be undone.')) return;
  var sc = findScene(activeSceneKey);
  sc.banners = sc.banners.filter(function(b){return b.id!==id;});
  markDirty(); renderEditor(); renderSceneList();
}
function dupBanner(id){
  var sc = findScene(activeSceneKey);
  var b = findBanner(sc,id); if(!b) return;
  var copy = JSON.parse(JSON.stringify(b));
  copy.id = b.id+'-copy-'+Date.now().toString(36).slice(-4);
  copy.label = (b.label||'Banner')+' (copy)';
  sc.banners.push(copy);
  markDirty(); renderEditor(); renderSceneList();
}
function seedLangForBanner(id){
  var sc = findScene(activeSceneKey);
  var b = findBanner(sc,id); if(!b) return;
  b.text = b.text||{}; b.text[activeLang] = {title:'',body:''};
  b.audio = b.audio||{}; b.audio[activeLang] = '';
  markDirty(); renderEditor();
}

/* ═══ Panorama view ═══ */
function renderPanoramaView(){
  var sc = findScene(activeSceneKey);
  var c = document.getElementById('jcMain');
  if(!sc){ c.innerHTML='<p>Select a scene</p>'; return; }
  var panoIds = sc.panoramas&&sc.panoramas.length ? sc.panoramas : (function(){
    // derive from banners
    var s={}; sc.banners.forEach(function(b){if(b.panorama) s[b.panorama]=true;});
    return Object.keys(s);
  })();
  var bannersByPano = {};
  sc.banners.forEach(function(b){
    var key = b.panorama || ('('+b.trigger+')');
    bannersByPano[key] = bannersByPano[key]||[];
    bannersByPano[key].push(b);
  });
  var nonPanoramaBanners = sc.banners.filter(function(b){return !b.panorama;});
  var html = '<div class="jc-editor-head">'+
    '<div><h3>Step '+sc.step+' — Panorama overview</h3>'+
    '<div class="meta">'+(panoIds.length||'No')+' panorama'+(panoIds.length!==1?'s':'')+' · '+sc.banners.length+' banner'+(sc.banners.length!==1?'s':'')+'</div></div>'+
    '<div><button class="btn btn-sm" data-jc="view" data-v="editor"><i class="fas fa-arrow-left"></i> Back to Editor</button></div>'+
  '</div>';
  if(panoIds.length===0 && nonPanoramaBanners.length===0){
    html += '<div class="jc-pano-noban">This scene has no panoramas configured.</div>';
  }
  if(panoIds.length){
    html += '<div class="jc-pano-grid">'+panoIds.map(function(pid){
      var bns = bannersByPano[pid]||[];
      return '<div class="jc-pano-card">'+
        '<div class="jc-pano-thumb">'+
          '🕋'+
          bns.map(function(b){
            var p=b.position||{x:50,y:50};
            return '<div class="pano-marker" style="left:'+p.x+'%;top:'+p.y+'%" title="'+esc(b.label||b.id)+'"></div>';
          }).join('')+
        '</div>'+
        '<div class="jc-pano-id">'+esc(pid)+'</div>'+
        '<div class="jc-pano-banners">'+
          (bns.length?bns.map(function(b){
            var t=(b.text&&b.text[activeLang])||{title:'(no '+activeLang+')'};
            return '<div class="pb-row" data-jc="focus-banner" data-id="'+esc(b.id)+'" style="cursor:pointer">'+
              '<span>'+esc(t.title||b.label)+'</span>'+
              '<small>'+esc(b.template)+'</small>'+
            '</div>';
          }).join(''):'<div class="jc-pano-noban">No banners on this panorama</div>')+
        '</div>'+
      '</div>';
    }).join('')+'</div>';
  }
  if(nonPanoramaBanners.length){
    html += '<div style="margin-top:18px"><div class="jc-side-head">Non-panorama banners (guide screens, sequences, scene-load)</div>';
    html += nonPanoramaBanners.map(function(b){
      var t=(b.text&&b.text[activeLang])||{title:'(no '+activeLang+')'};
      return '<div class="pb-row" style="background:var(--bg-tertiary);padding:8px 12px;border-radius:6px;margin-bottom:6px;display:flex;justify-content:space-between;cursor:pointer" data-jc="focus-banner" data-id="'+esc(b.id)+'">'+
        '<span><strong>'+esc(b.label||b.id)+'</strong> <small style="color:var(--text-muted)">— '+esc(t.title)+'</small></span>'+
        '<small style="color:var(--text-muted)">'+esc(b.trigger)+' · '+esc(b.template)+'</small>'+
      '</div>';
    }).join('');
    html += '</div>';
  }
  c.innerHTML = html;
}

function focusBanner(bannerId){
  activeView='editor';
  renderMain();
  setTimeout(function(){
    var el = document.getElementById('jc-banner-'+bannerId);
    if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.style.outline='2px solid var(--gold)'; setTimeout(function(){el.style.outline='';},1500); }
  }, 50);
}

/* ─── Languages ─── */
function addLanguagePrompt(){
  var code = prompt('Language code (e.g. fr, ur, tr):');
  if(!code) return;
  code = code.trim().toLowerCase();
  if(data.languages.find(function(l){return l.code===code;})){ alert('Language already exists.'); return; }
  var name = prompt('Display name (e.g. Français, اردو, Türkçe):', code.toUpperCase()) || code.toUpperCase();
  var dir = /^(ar|ur|fa|he)$/i.test(code) ? 'rtl' : 'ltr';
  data.languages.push({code:code,name:name.trim(),dir:dir,isDefault:false});
  markDirty(); renderLangBar();
}
function removeLanguage(code){
  if(!confirm('Remove "'+code+'" and all its translations?')) return;
  data.languages = data.languages.filter(function(l){return l.code!==code;});
  data.scenes.forEach(function(s){ s.banners.forEach(function(b){
    if(b.text)delete b.text[code]; if(b.audio)delete b.audio[code]; if(b.audioChain)delete b.audioChain[code];
  }); });
  if(activeLang===code) activeLang = data.languages[0].code;
  markDirty(); renderLangBar(); renderMain();
}

/* ─── Audio: upload + preview ─── */
function uploadAudioFor(bannerId, field){
  var inp = document.createElement('input');
  inp.type='file'; inp.accept='audio/*';
  inp.onchange=function(){
    var f=inp.files[0]; if(!f) return;
    if(f.size > 6*1024*1024){ if(!confirm('File is '+(f.size/1024/1024).toFixed(1)+' MB. Storing as base64 in localStorage may exceed quota. Continue?')) return; }
    var r=new FileReader();
    r.onload=function(){
      var sc=findScene(activeSceneKey); var b=findBanner(sc,bannerId); if(!b) return;
      b[field] = b[field]||{};
      b[field][activeLang] = r.result;
      markDirty(); renderEditor();
      flash('Audio uploaded — remember to Save');
    };
    r.readAsDataURL(f);
  };
  inp.click();
}
function clearAudioFor(bannerId, field){
  var sc=findScene(activeSceneKey); var b=findBanner(sc,bannerId); if(!b) return;
  var current = (b[field]&&b[field][activeLang])||'';
  if(!current) return;
  if(!confirm('Remove the '+(field==='audioChain'?'chained ':'')+'audio file for ['+activeLang+']? Banner text is kept.')) return;
  b[field] = b[field]||{};
  b[field][activeLang] = '';
  markDirty(); save(); renderEditor();
  flash('Audio file removed');
}
function playPreview(file){
  if(!file) return;
  if(window._jcPreview){window._jcPreview.pause();}
  var a = new Audio(audioUrl(file));
  window._jcPreview = a;
  a.play().catch(function(e){ flash('Audio playback failed: '+e.message, true); });
}

/* ─── Export ─── */
function exportJSON(){
  var blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'pilgrimspath-journey-content-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url);}, 1000);
}

/* ─── Public ─── */
window.PPJourneyContent = {
  mount: mount,
  get: publicGet,
  templates: BANNER_TEMPLATES,
  templateCss: function(tplId){ var t=BANNER_TEMPLATES[tplId]; return t?t.css:''; },
  _data: function(){return data;}
};

})();
