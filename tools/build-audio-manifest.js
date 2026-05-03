#!/usr/bin/env node
/*
 * build-audio-manifest.js
 *
 * Run this any time you add/remove voiceover MP3 files.
 * It scans every language sub-folder under "Hajj voiceover english/"
 * and writes /audio-manifest.json — which the admin UI reads to
 * populate the audio-file dropdowns.
 *
 * Usage:  node tools/build-audio-manifest.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const AUDIO_ROOT = path.join(ROOT, 'Hajj voiceover english');
const OUT_FILE = path.join(ROOT, 'audio-manifest.json');

if (!fs.existsSync(AUDIO_ROOT)) {
  console.error('Audio root not found:', AUDIO_ROOT);
  process.exit(1);
}

const langs = fs.readdirSync(AUDIO_ROOT)
  .filter(n => fs.statSync(path.join(AUDIO_ROOT, n)).isDirectory());

const manifest = { generatedAt: new Date().toISOString(), languages: {} };

for (const lang of langs) {
  const dir = path.join(AUDIO_ROOT, lang);
  const files = fs.readdirSync(dir)
    .filter(f => /\.(mp3|m4a|ogg|wav)$/i.test(f))
    .sort((a, b) => {
      // natural sort: "2 ..." before "10 ..."
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
      return a.localeCompare(b);
    });
  manifest.languages[lang] = { folder: lang + '/', files };
}

fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2), 'utf8');

console.log('Wrote', OUT_FILE);
for (const [lang, v] of Object.entries(manifest.languages)) {
  console.log('  ' + lang + ': ' + v.files.length + ' files');
}
