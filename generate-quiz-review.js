// Generates QUIZ_QUESTIONS_REVIEW.md from quiz-content.js
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'pilgrimspath-vr', 'quiz-content.js'), 'utf8');
const sandbox = { window: {} };
(new Function('window', src))(sandbox.window);
const Q = sandbox.window.PPQuiz.questions;
const titles = {
  1: 'Tawaf x7 (initial Umrah Tawaf)',
  2: "Sa'i between Safa and Marwa",
  3: 'Halaq / Taqsir for Umrah',
  4: 'Rest & Pray (between Umrah and Hajj)',
  5: 'Re-enter Ihram (8th Dhul-Hijjah)',
  6: 'Mina, 8th day (Yawm at-Tarwiyah)',
  7: 'Arafah, 9th day',
  8: 'Muzdalifah',
  9: "Rami Jamrah al-Aqabah, 10th",
  10: 'Qurbani, 10th day',
  11: 'Halaq (head shave for Hajj), 10th day',
  12: 'Tawaf al-Ifadah',
  13: 'Rami all three pillars, 11th day',
  14: 'Spend Night at Mina (Days of Tashreeq)',
  15: 'Rami all three pillars, 12th day + Nafr Awwal/Thani',
  16: 'Tawaf al-Wida (Farewell Tawaf)'
};
const out = [];
out.push('# Pilgrim\u2019s Path — Quiz Question Bank (v3) — Review & Approval');
out.push('');
out.push('This file lists every question that may appear in the per-step reflection quiz, sourced from the Hajj voiceover script.');
out.push('');
out.push('At runtime the engine **shuffles** each step\u2019s pool, picks **' + sandbox.window.PPQuiz.questionsPerSession + ' random questions** for the session, and also shuffles the order of the answer choices (the correct index is remapped automatically). Correct answers below are marked \u2705.');
out.push('');
let grand = 0;
Object.keys(Q).map(Number).sort((a, b) => a - b).forEach(k => {
  const arr = Q[k];
  grand += arr.length;
  out.push('---');
  out.push('');
  out.push('## Step ' + k + ' — ' + (titles[k] || '(untitled)'));
  out.push('');
  out.push('_' + arr.length + ' questions in pool._');
  out.push('');
  arr.forEach((q, i) => {
    out.push('### Q' + (i + 1) + '. ' + q.q);
    q.a.forEach((opt, j) => {
      const mark = (j === q.correct) ? ' \u2705' : '';
      out.push('- ' + String.fromCharCode(65 + j) + '. ' + opt + mark);
    });
    if (q.why) {
      out.push('');
      out.push('> **Why:** ' + q.why);
    }
    out.push('');
  });
});
out.push('---');
out.push('');
out.push('**Total questions across all steps: ' + grand + '**');
fs.writeFileSync(path.join(__dirname, 'QUIZ_QUESTIONS_REVIEW.md'), out.join('\n'), 'utf8');
console.log('Wrote QUIZ_QUESTIONS_REVIEW.md (' + grand + ' questions across ' + Object.keys(Q).length + ' steps)');
