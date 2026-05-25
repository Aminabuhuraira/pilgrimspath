/* ═══════════════════════════════════════════════
   VR AMBIENT FIX — v1
   ═══════════════════════════════════════════════
   3DVista tour scripts attach a "PanoramaAudio" resource with autoplay:true
   to every panorama (typically a crowd ambience loop). When a scene's
   admin-set narration plays, the embedded TDV ambient track also plays at
   full volume, producing the "two audios at once" effect.

   This script muffles ONLY the 3DVista-embedded media (URLs containing
   `/media/audio_<HEX>...mp3` — a stable pattern unique to TDV-generated
   assets) to AMBIENT_VOLUME so the admin narration is always dominant.

   It MUST load before `script.js` (the 3DVista bundle) so its Audio
   constructor and HTMLMediaElement.src hooks are in place before any
   PanoramaAudio is instantiated.
   ─────────────────────────────────────────────── */
(function(){
  if(window.__ppVrAmbientFix) return;
  window.__ppVrAmbientFix = true;

  // Volume level for ambient loops (0.0 = silent, 1.0 = full).
  // 0.10 keeps a faint sense of atmosphere while never competing with VO.
  var AMBIENT_VOLUME = 0.10;

  // Matches 3DVista-generated audio assets (media/audio_<HEX>...mp3) regardless
  // of whether the URL is absolute, root-relative, or scene-relative.
  var TDV_AUDIO_RE = /(?:^|\/)media\/audio_[A-F0-9_]+(?:_[a-z]{2})?\.mp3(?:[?#]|$)/i;

  function isTDVEmbedded(src){
    if(!src) return false;
    try{ return TDV_AUDIO_RE.test(String(src)); }catch(_){ return false; }
  }

  function muffle(el){
    if(!el) return;
    try{
      el.volume = AMBIENT_VOLUME;
      // Re-apply on every play() in case TDV resets volume internally.
      if(!el.__ppMuffleBound){
        el.__ppMuffleBound = true;
        el.addEventListener('volumechange', function(){
          if(el.volume > AMBIENT_VOLUME + 0.01){
            try{ el.volume = AMBIENT_VOLUME; }catch(_){}
          }
        });
      }
    }catch(_){}
  }

  // ── Hook 1: window.Audio constructor (TDV mostly uses this) ──
  try{
    var _RealAudio = window.Audio;
    function HookedAudio(src){
      var a = arguments.length ? new _RealAudio(src) : new _RealAudio();
      if(isTDVEmbedded(arguments[0]||'')) muffle(a);
      // Also watch for late src assignment via property setter.
      return a;
    }
    HookedAudio.prototype = _RealAudio.prototype;
    try{ Object.setPrototypeOf(HookedAudio, _RealAudio); }catch(_){}
    window.Audio = HookedAudio;
  }catch(_){}

  // ── Hook 2: HTMLMediaElement.prototype.src setter (catches <audio>/<video>
  //    elements created via DOM and any late src assignment on Audio objects) ──
  try{
    var proto = HTMLMediaElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, 'src') ||
               Object.getOwnPropertyDescriptor(HTMLAudioElement.prototype, 'src');
    if(desc && desc.set){
      Object.defineProperty(proto, 'src', {
        configurable: true, enumerable: true,
        get: desc.get,
        set: function(v){
          desc.set.call(this, v);
          if(isTDVEmbedded(v)) muffle(this);
        }
      });
    }
  }catch(_){}

  // ── Hook 3: play() — last-ditch volume enforcement at the moment audio
  //    actually starts. Some TDV builds set volume after src and before play. ──
  try{
    var _origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function(){
      try{
        if(isTDVEmbedded(this.currentSrc || this.src)) muffle(this);
      }catch(_){}
      return _origPlay.apply(this, arguments);
    };
  }catch(_){}

  // ── Hook 4: MutationObserver fallback for <audio>/<source> elements
  //    inserted into the DOM without going through the setter (rare). ──
  try{
    var mo = new MutationObserver(function(records){
      for(var i=0;i<records.length;i++){
        var added = records[i].addedNodes;
        for(var j=0;j<added.length;j++){
          var n = added[j];
          if(n && n.nodeType === 1){
            if((n.tagName === 'AUDIO' || n.tagName === 'VIDEO') &&
               isTDVEmbedded(n.currentSrc || n.src)) muffle(n);
            // Check nested <source> as well
            try{
              var srcs = n.querySelectorAll && n.querySelectorAll('audio, video, source');
              if(srcs){
                for(var k=0;k<srcs.length;k++){
                  var s = srcs[k];
                  if(isTDVEmbedded(s.src || (s.parentNode && s.parentNode.currentSrc))){
                    muffle(s.tagName === 'SOURCE' ? s.parentNode : s);
                  }
                }
              }
            }catch(_){}
          }
        }
      }
    });
    if(document.documentElement) mo.observe(document.documentElement, {childList:true, subtree:true});
  }catch(_){}

  // Expose a tiny console handle for live tweaking / debugging.
  window.__ppAmbient = {
    setVolume: function(v){
      AMBIENT_VOLUME = Math.max(0, Math.min(1, +v||0));
      document.querySelectorAll('audio, video').forEach(function(el){
        if(isTDVEmbedded(el.currentSrc || el.src)) muffle(el);
      });
      return AMBIENT_VOLUME;
    },
    mute: function(){ return this.setVolume(0); },
    isMatch: isTDVEmbedded
  };
})();
