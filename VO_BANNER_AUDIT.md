# Pilgrim's Path — Voiceover-to-Banner Mapping Audit
**Date:** 10 May 2026 | **Auditor:** GitHub Copilot | **Seed Version at time of audit:** 18

---

## SECTION 1: CORRECT MAPPINGS ✅

**VO 1 → Scene: Step 1 — Tawaf (Initial Umrah) | Banner: `tw-guide-0` (Guide Screen 1)**
- Banner text: "Welcome to this immersive Hajj experience, a journey of faith, devotion, and unity..."
- Status: ✅ Correctly mapped
- Notes: Matches VO 1 word-for-word including the closing blessing.

---

**VO 2 → Scene: Step 1 — Tawaf (Initial Umrah) | Banner: `tw-guide-1` (Guide Screen 2)**
- Banner text: Lists all six Ihram restrictions as a formatted `<ul>` list
- Status: ✅ Correctly mapped
- Notes: Minor reformatting (bullet list vs. numbered list in script). All six restrictions present.

---

**VO 3 → Scene: Step 1 — Tawaf (Initial Umrah) | Banner: `tw-guide-2` (Guide Screen 3)**
- Banner text: "After donning Ihram, make the intention for Hajj and recite the Talbiyah..." with Arabic + transliteration + translation
- Status: ✅ Correctly mapped
- Notes: Adds Arabic script line not in the written VO text but content is correct.

---

**VO 4 → Scene: Step 1 — Tawaf (Initial Umrah) | Banner: `tw-guide-3` (Guide Screen 4)**
- Banner text: "Congratulations — you are now in the state of Ihram and must adhere to all restrictions."
- Status: ✅ Correctly mapped
- Notes: Minor expansion ("You may now proceed towards Al-Masjid Al-Haram") is acceptable bridge text.

---

**VO 5 → Scene: Step 1 — Tawaf | Banner: `tw-pano-8CE4041C` (Panorama — Haram entrance)**
- Banner text: Entry dua, right foot, Arabic + translation
- Status: ✅ Correctly mapped
- Notes: Prefixed with "Voice-over:" label in body — cosmetic only.

---

**VO 6 → Scene: Step 1 — Tawaf | Banner: `tw-pano-89070D75` (Panorama — First sight of Kaaba)**
- Banner text: "Upon sighting the Kaaba, raise your hands... Allahumma zid hadha al-bayt..."
- Status: ✅ Correctly mapped
- Notes: Prefixed with "Voice-over:" label — cosmetic only.

---

**VO 7 + VO 8 → Scene: Step 1 — Tawaf | Banner: `tw-pano-7F92625E` (Panorama — Begin Tawaf)**
- Banner text: Covers VO 7 ("begin Tawaf... Bismillahi Allahu Akbar") and VO 8 ("you may recite any duas or dhikr") in one banner
- Status: ✅ Correctly mapped — both VOs combined; VO 8 delivered via `audioChain`
- Notes: Correct use of `audioChain` to sequence both audios in order.

---

**VO 9 → Scene: Step 1 — Tawaf | Banner: `tw-pano-7F927F34` (Panorama — Yemeni Corner)**
- Banner text: Yemeni Corner touch + "Rabbana atina fid-dunya hasanatan..."
- Status: ✅ Correctly mapped
- Notes: Appropriate expansion — adds instruction to touch with right hand.

---

**VO 10 → Scene: Step 1 — Tawaf | Banner: `tw-pano-7F9246DB` (Panorama — Maqam Ibrahim)**
- Banner text: "Here at the Maqam Ibrahim... offer two rak'ahs of Salah. In the first rak'ah..."
- Status: ✅ Correctly mapped
- Notes: Prefixed with "Voice-over:" label — cosmetic only.

---

**VO 11 → Scene: Step 2 — Sa'i | Banner: `sm-pano-1` (Panorama — Beginning at Safa)**
- Banner text: Full Safa declaration + all three duas from the VO script
- Status: ✅ Correctly mapped

---

**VO 12 → Scene: Step 2 — Sa'i | Banner: `sm-pano-2` (Panorama — Walking between hills)**
- Banner text: "As you walk between the two hills seven times, recite dhikr... green markers... hasten your pace..."
- Status: ✅ Correctly mapped

---

**VO 13 + VO 14 → Scene: Step 2 — Sa'i | Banner: `sm-pano-3` (Panorama — Halaq/Completion)**
- Banner text: VO 13 (Halaq) + VO 14 (Congratulations, Umrah complete) combined
- Status: ✅ Correctly mapped — VO 14 audio delivered via `audioChain`

---

**VO 15 → Scene: Step 6 — Mina (8th Day) | Banner: `mn-pano-8th` (Panorama)**
- Banner text: "On this day, the 8th day of Dhul-Hijjah, known as Yawm at-Tarwiyah..."
- Status: ✅ Correctly mapped

---

**VO 16 → Scene: Step 7 — Arafah (9th Day) | Banner: `ar-seq-1` (Sequence 1)**
- Banner text: "On this day, the 9th day — the Day of Arafah — we have now arrived on the plains of Arafat..."
- Status: ✅ Correctly mapped

---

**VO 17 → Scene: Step 7 — Arafah | Banner: `ar-seq-2` (Sequence 2)**
- Banner text: "You will now be taken to Muzdalifah. Here, pray Maghrib and Isha together... collect at least 49 or 70 pebbles..."
- Status: ✅ Correctly mapped

---

**VO 18 → Scene: Step 7 — Arafah | Banner: `ar-seq-3` (Sequence 3)**
- Banner text: "Congratulations — you may now proceed to any resting area under the open sky."
- Status: ✅ Correctly mapped

---

**VO 19 → Scene: Step 9 — Jamarat 10th Day | Banner: `jm10-pano-rooftop` (Panorama — Rooftop overview)**
- Banner text: "Today is the 10th day, Yawm an-Nahr... four key actions: Stone Jamrah al-Aqaba, Qurbani, Shave/trim, Return to Haram"
- Status: ✅ Correctly mapped

---

**VO 20 → Scene: Step 9 — Jamarat 10th Day | Banner: `jm10-pano-aqabah` (Panorama — Aqabah pillar)**
- Banner text: "Jamrah al-ʿAqabah (the largest). You will throw seven pebbles... Bismillāh, Allāhu Akbar."
- Status: ✅ Correctly mapped
- Notes: Adds interaction instructions for the VR mechanic — appropriate experience-specific content.

---

**VO 21 → Scene: Step 10 — Qurbani | Banner: `qb-load` (Scene load)**
- Banner text: "Make your way to the merchant to perform a sacrificial offering. By offering a token, they will handle the Qurbani and give out the meat as sadaqa in your name to those most in need."
- Status: ✅ Correctly mapped *(Updated 9 May 2026)*

---

**VO 22 → Scene: Step 11 — Barber Hajj | Banner: `bh-load` (Scene load)**
- Banner text: "Here Men will shave their heads or trim their hair, while women will cut a small portion of their hair."
- Status: ✅ Correctly mapped *(Updated 9 May 2026)*

---

**VO 23 → Scene: Step 11 — Barber Hajj | Banner: `bh-continue` (Button trigger)**
- Banner text: "You will now proceed to Tawaf al-Ifadah, the obligatory circumambulation performed after the sacrifice and Halaq."
- Status: ✅ Correctly mapped
- Notes: VO 23 is brief ("proceed to Al-Masjid Al-Haram"). Banner is an acceptable expansion.

**VO 23 → Scene: Step 12 — Tawaf al-Ifadha | Banner: `ti-pano-1` (Panorama — Ifadha entry)**
- Banner text: "You now perform Tawaf al-Ifadha, the obligatory circumambulation on the 10th of Dhul-Hijjah..."
- Status: ✅ Correctly mapped

---

**VO 24 → Scene: Step 12 — Tawaf al-Ifadha | Banner: `ti-pano-2` (Panorama — Continuing Ifadha)**
- Banner text: "This is the second Tawaf you will perform, the first one being the one carried out during Umrah. This Tawaf is called Tawaf al-Ifadah."
- Status: ✅ Correctly mapped *(Updated 9 May 2026)*

---

**VO 25 → Scene: Step 12 — Tawaf al-Ifadha | Banner: `ti-pano-3` (Panorama — Journey back to Mina)**
- Banner text: "Now, you'll journey back to Mina to complete the Rami Al-Jamarat rituals for the 11th, 12th, and optional for the 13th day of Hajj."
- Status: ✅ Correctly mapped *(Updated 9 May 2026)*

---

**VO 26 → Scene: Step 13 — Jamarat 11th Day | Banner: `jm11-pano` (Panorama)**
- Banner text: "As you begin the 11th Day of Dhul-Hijjah you will be repeating the stoning... Jamarat al-Ula, Jamarat al-Wusta, Jamarat al-Aqabah... seven pebbles each."
- Status: ✅ Correctly mapped *(Updated 9 May 2026)*

---

**VO 27 → Scene: Step 13 — Jamarat 11th Day | Banner: `jm11-complete` (Completion trigger)**
- Banner text: "Day 11 Complete — Return to your tent at Mina for rest and prayer."
- Status: ✅ Correctly mapped
- Notes: VO 27 is a single sentence. Banner is a valid summarization.

---

**VO 28 → Scene: Step 14 — Mina Tents 12th | Banner: `mn12-pano` (Panorama)**
- Banner text: "Once again, you're at Mina and ready to perform the stoning ritual of Rami al-Jamarat on the 12th day... Jamarat al-Ula, Jamarat al-Wusta, Jamarat al-ʻAqabah"
- Status: ✅ Correctly mapped

---

**VO 29 → Scene: Step 15 — Jamarat 12th | Banner: `jm12-complete` (Completion trigger)**
- Banner text: "Well-done on completing the stoning ritual on this day, you have the choice to either: Leave Mina to perform your final tawaf early. or Remain in Mina to continue the ritual on the 13th day."
- Status: ✅ Correctly mapped

---

**VO 32 → Scene: Step 16 — Farewell Tawaf | Banner: `tf-pano-1` (Panorama — Farewell entry)**
- Banner text: "You now perform your final Tawaf, called Tawaf al-Wida (the Farewell Circumambulation)..."
- Status: ✅ Correctly mapped
- Notes: VO 32 is brief. Banner is an appropriate expansion.

---

**VO 33 → Scene: Step 16 — Farewell Tawaf | Banner: `tf-pano-4` (Panorama — Farewell completion)**
- Banner text: Exit dua in Arabic, transliteration, translation, and congratulations message.
- Status: ✅ Correctly mapped *(Updated 9 May 2026)*

---

## SECTION 2: INCORRECT MAPPINGS ❌

**VO 13 → Scene: Step 3 — Clip/Shave Hair (Umrah) | Banner: `bu-load` (Scene load)**
- Banner text shown: "A small symbolic trim completes your Umrah and exits the state of Ihram. Men may shave or trim, women trim a fingertip's length."
- Expected voiceover content (VO 13): "Upon completing Saee, Men get their heads shaved or trimmed, while women only get their hair trimmed. This now signifies you are out of the boundaries of Ihram and will await the 8th of Dhul Hajjah."
- Status: ❌ Mismatch
- Likely cause: Text was written independently rather than taken from the official VO script. "Fingertip's length" does not appear in the script. "Small symbolic trim" misrepresents a required religious act.
- Fix: Replace body with:
  ```html
  <p class="bb">Upon completing Sa'i, men get their heads shaved or trimmed, while women only get their hair trimmed. This signifies you are out of the state of Ihram and will await the 8th of Dhul-Hijjah.</p>
  ```

---

**VO 17 (text) / VO 18 (audio) → Scene: Step 8 — Muzdalifah | Banner: `mz-load` (Scene load)**
- Banner text shown: "After sunset on the 9th, travel from Arafah to Muzdalifah. Pray Maghrib and Isha together... collect at least 49 pebbles..."
- Audio assigned: `18 English 9th Day Dhul Hijjah 3.mp3` (VO 18 = "Congratulations, you may now proceed to any resting area...")
- Status: ❌ Audio/text mismatch — banner displays VO 17 content but plays VO 18 audio
- Likely cause: Wrong audio file was assigned. VO 17 audio is already correctly used in `ar-seq-2` (Arafah scene). The Muzdalifah scene-load banner duplicates that content with the wrong audio.
- Fix: Change audio assignment from `18 English 9th Day Dhul Hijjah 3.mp3` to `17 English 9th Day Dhul Hijjah 2.mp3`.

---

**VO 28 (text) + VO 29 (audio) → Scene: Step 15 — Jamarat 12th | Banner: `jm12-pano` (Panorama)**
- Banner text shown: "Once again, you're at Mina and ready to perform the stoning ritual of Rami al-Jamarat on the 12th day..." (VO 28 content)
- Audio assigned: `29 English 12th day dhul hijjah 2.mp3` (VO 29 = "Well-done on completing the stoning...")
- Status: ❌ Audio/text mismatch — text is VO 28 content but audio file is VO 29
- Fix: Change audio from `29 English 12th day dhul hijjah 2.mp3` to `28 English 12th Dhul Hijjah 1.mp3`.

---

**VO 30 (audio) + VO 29 (text) → Scene: Step 15 — Jamarat 12th | Banner: `jm12-day13-option` (Completion trigger)**
- Banner text shown: "You have two options: Option 1 — Depart today (12th)... Option 2 — Stay until 13th..." (VO 29 decision content)
- Audio assigned: `30 English Day 13 dhul hijjah 1.mp3` (VO 30 = 13th day stoning instructions)
- Status: ❌ Double mismatch — text describes the VO 29 stay/leave decision, audio plays VO 30
- Fix: Change audio to `29 English 12th day dhul hijjah 2.mp3` to match the displayed text, OR replace the text with VO 30 content:
  ```html
  <p class="bb">If you chose to stay for the 13th day, perform the stoning of Rami al-Jamarat one final time. Stone each pillar — Jamarat al-Ula, Jamarat al-Wusta, Jamarat al-Aqabah — throwing seven pebbles each while saying Bismillahi Allahu Akbar.</p>
  ```

---

## SECTION 3: MISSING BANNERS ⚠️

**VO 30 — 13th Day of Dhul-Hijjah (Stoning Instructions)**
- Status: ⚠️ No banner found — the content for VO 30 has no matching banner that displays it with the correct audio
- Voiceover content: "Final Day in Mina. Rami al-Jamarat. Once more, visit each of the three pillars: Jamarat al-Ula, Jamarat al-Wusta, Jamarat al-Aqabah. Throw seven pebbles while saying 'Bismillahi Allahu Akbar' with each throw."
- Recommended action: Create a new banner (trigger: `completion` in `jamarat-12th` scene or a dedicated 13th-day panorama) with:
  ```
  ID: jm13-pano
  Title: 🕋 13th Day of Dhul-Hijjah
  Body: <p class="bb">If you chose to remain in Mina, this is your final day of stoning. Stone each pillar in order — Jamarat al-Ula, Jamarat al-Wusta, Jamarat al-Aqabah — throwing seven pebbles while saying Bismillahi Allahu Akbar with each throw.</p>
  Audio: 30 English Day 13 dhul hijjah 1.mp3
  ```

---

**VO 31 — Depart from Mina**
- Status: ⚠️ No banner found anywhere in the experience
- Voiceover content: "Congratulations on completing the stoning on this final day. You will now leave Mina for Masjidul-Haram, as you have completed the rites of Tashreeq."
- Recommended action: Create a completion/transition banner in `jamarat-12th` scene:
  ```
  ID: jm13-complete
  Template: sunrise-gold
  Title: 🎉 Rites of Tashreeq Complete
  Body: <p class="bb">Congratulations on completing the stoning ritual. You will now leave Mina for Al-Masjid Al-Haram, as you have completed the rites of Tashreeq.</p>
  Audio: 31 English Depart from Mina.mp3 (verify filename on server)
  ```

---

## SECTION 4: ORPHANED BANNERS 🔴

**Scene: Step 3 — Clip/Shave Hair (Umrah) — `bu-load`**
- Banner text: "A small symbolic trim completes your Umrah..."
- Status: 🔴 Partially orphaned — uses VO 13 audio but text doesn't match script (see Section 2). This scene also duplicates the `sm-pano-3` banner in the Sa'i scene which already correctly covers VO 13+14. Unclear if this scene is reachable in the normal user flow.
- Recommended action: Fix text to match VO 13 exactly (see Section 2 fix), and confirm whether this scene is active or redundant.

---

**Scene: Step 4 — Resting & Praying — `rs-load`**
- Banner text: "After completing Umrah, take time to rest, pray, and reflect..."
- Status: 🔴 Orphaned — no audio assigned, no matching VO number in the script.
- Recommended action: Keep as a silent informational card (no audio needed). Remove from active journey flow if not required.

---

**Scene: Step 5 — Re-enter Ihram — `ri-load`**
- Banner text: "On the 8th of Dhul-Hijjah, re-enter the state of Ihram with the intention for Hajj..."
- Status: 🔴 Orphaned — audio assigned is `2 English Ihram part 1.mp3` (VO 2 — Ihram restrictions before Umrah). Re-using VO 2 replays audio the user already heard at the start.
- Recommended action: Clear the audio assignment (set to empty string) so this is a silent text-only card, preventing VO 2 from playing twice.

---

**Scene: Step 6 — Mina (8th Day) — `mn-pano-congrats`**
- Banner text: "You have completed your time at Mina for the 8th Day... tap Next Stop →"
- Status: 🔴 Orphaned — no audio, no matching VO.
- Recommended action: Keep as a silent UI navigation card.

---

**Scene: Step 7 — Arafah — `ar-pano-congrats`**
- Banner text: "You have completed the Day of Arafah... tap Next Stop →"
- Status: 🔴 Orphaned — no audio, no matching VO.
- Recommended action: Keep as a silent UI navigation card.

---

**Scene: Step 12 — Tawaf al-Ifadha — `ti-pano-4`**
- Banner text: "You are now back at Mina. Rest, pray, and prepare for the remaining days of Tashreeq..."
- Status: 🔴 Orphaned — no audio. Content overlaps with VO 25 (`ti-pano-3`).
- Recommended action: Assign VO 25 audio (`25 English 10th day Dhul Hijjah 7.mp3`) if this panorama fires after `ti-pano-3`, or keep silent if redundant.

---

**Scene: Step 12 — Tawaf al-Ifadha — `ti-complete`**
- Banner text: "MashaAllah — you have completed Tawaf al-Ifadha, an essential pillar of Hajj..."
- Status: 🔴 Orphaned — no audio. No matching VO for a Tawaf al-Ifadha completion moment.
- Recommended action: Keep as a silent UI completion card.

---

**Scene: Step 16 — Farewell Tawaf — `tf-pano-2`**
- Banner text: "As you walk in Tawaf al-Wida, reflect on your Hajj journey..."
- Status: 🔴 Orphaned — no audio. Script has no VO between VO 32 (entry) and VO 33 (exit dua).
- Recommended action: Keep as a silent atmospheric banner shown during walking circuits.

---

**Scene: Step 16 — Farewell Tawaf — `tf-pano-3`**
- Banner text: "Continue with devotion as you complete the final circuits of Tawaf al-Wida..."
- Status: 🔴 Orphaned — no audio. Same reason as `tf-pano-2`.
- Recommended action: Keep as a silent atmospheric banner.

---

## SECTION 5: SUMMARY TABLE

| VO # | Topic | Banner Found? | Mapping Status | Action Required |
|------|-------|:---:|:---:|---|
| 1 | Welcome | ✅ Yes (`tw-guide-0`) | ✅ Correct | None |
| 2 | Ihram Restrictions | ✅ Yes (`tw-guide-1`) | ✅ Correct | None |
| 3 | Talbiyah at Miqat | ✅ Yes (`tw-guide-2`) | ✅ Correct | None |
| 4 | Congratulations — In Ihram | ✅ Yes (`tw-guide-3`) | ✅ Correct | None |
| 5 | Entering Haram Mosque | ✅ Yes (`tw-pano-8CE4041C`) | ✅ Correct | None |
| 6 | Dua upon Seeing Kaaba | ✅ Yes (`tw-pano-89070D75`) | ✅ Correct | None |
| 7 | Begin Tawaf | ✅ Yes (`tw-pano-7F92625E`) | ✅ Correct | None |
| 8 | Continue Tawaf / Dhikr | ✅ Yes (`tw-pano-7F92625E` via audioChain) | ✅ Correct (combined with VO 7) | None |
| 9 | Yemeni Corner Dua | ✅ Yes (`tw-pano-7F927F34`) | ✅ Correct | None |
| 10 | Praying at Maqam Ibrahim | ✅ Yes (`tw-pano-7F9246DB`) | ✅ Correct | None |
| 11 | Sa'i — Beginning at Safa | ✅ Yes (`sm-pano-1`) | ✅ Correct | None |
| 12 | Sa'i — Walking between hills | ✅ Yes (`sm-pano-2`) | ✅ Correct | None |
| 13 | Halaq or Qasar (Umrah) | ✅ Yes (`sm-pano-3` ✅, `bu-load` ❌) | ❌ Mismatch on `bu-load` | Fix `bu-load` body text to match VO 13 |
| 14 | Congratulations — Umrah Complete | ✅ Yes (`sm-pano-3` via audioChain) | ✅ Correct | None |
| 15 | 8th Day of Dhul-Hijjah (Mina) | ✅ Yes (`mn-pano-8th`) | ✅ Correct | None |
| 16 | 9th Day — Day of Arafah | ✅ Yes (`ar-seq-1`) | ✅ Correct | None |
| 17 | Travel to Muzdalifah / Pebbles | ✅ Yes (`ar-seq-2` ✅, `mz-load` ❌) | ❌ Mismatch on `mz-load` audio | Fix `mz-load` audio → `17 English 9th Day Dhul Hijjah 2.mp3` |
| 18 | Rest under open sky | ✅ Yes (`ar-seq-3`) | ✅ Correct | None |
| 19 | 10th Day overview (Yawm an-Nahr) | ✅ Yes (`jm10-pano-rooftop`) | ✅ Correct | None |
| 20 | Rami al-Aqabah (stoning) | ✅ Yes (`jm10-pano-aqabah`) | ✅ Correct | None |
| 21 | Qurbani — The Sacrifice | ✅ Yes (`qb-load`) | ✅ Correct | None *(fixed 9 May)* |
| 22 | Shaving or Trimming Hair | ✅ Yes (`bh-load`) | ✅ Correct | None *(fixed 9 May)* |
| 23 | Travel to Al-Masjid Al-Haram | ✅ Yes (`bh-continue`, `ti-pano-1`) | ✅ Correct | None |
| 24 | Tawaf al-Ifadah | ✅ Yes (`ti-pano-2`) | ✅ Correct | None *(fixed 9 May)* |
| 25 | Journey Back to Mina | ✅ Yes (`ti-pano-3`) | ✅ Correct | None *(fixed 9 May)* |
| 26 | 11th Day — Rami al-Jamarat | ✅ Yes (`jm11-pano`) | ✅ Correct | None *(fixed 9 May)* |
| 27 | Day 11 Complete | ✅ Yes (`jm11-complete`) | ✅ Correct | None |
| 28 | 12th Day — Rami al-Jamarat | ✅ Yes (`mn12-pano` ✅, `jm12-pano` ❌) | ❌ Mismatch on `jm12-pano` audio | Fix `jm12-pano` audio → `28 English 12th Dhul Hijjah 1.mp3` |
| 29 | Decision: Stay or Leave Mina | ✅ Yes (`jm12-complete` ✅, `jm12-day13-option` ❌) | ❌ Mismatch on `jm12-day13-option` audio | Fix audio or align text on `jm12-day13-option` |
| 30 | 13th Day — Stoning Instructions | ❌ No | ⚠️ Missing | Create `jm13-pano` banner with VO 30 content + audio |
| 31 | Depart from Mina | ❌ No | ⚠️ Missing | Create `jm13-complete` banner with VO 31 content + audio |
| 32 | Farewell Tawaf (Tawaf al-Wida) | ✅ Yes (`tf-pano-1`) | ✅ Correct | None |
| 33 | Completing Farewell Tawaf + Exit Dua | ✅ Yes (`tf-pano-4`) | ✅ Correct | None *(fixed 9 May)* |

---

## TOTALS

| Category | Count |
|---|:---:|
| ✅ Correct | 28 |
| ❌ Mismatch (audio or text wrong) | 4 |
| ⚠️ Missing banner (no banner at all) | 2 |
| 🔴 Orphaned (no VO assigned) | 8 |
| **Total VOs** | **33** |

---

## PRIORITY FIX ORDER

1. **HIGH** — `jm12-pano` audio: mis-assigned VO 29 audio on VO 28 content
2. **HIGH** — `jm12-day13-option` audio: mis-assigned VO 30 audio on VO 29 content
3. **HIGH** — `mz-load` audio: mis-assigned VO 18 audio on VO 17 content
4. **MEDIUM** — `bu-load` text: body doesn't match VO 13 script
5. **MEDIUM** — Create missing banners for VO 30 and VO 31 (13th day stoning + depart Mina)
6. **LOW** — `ri-load` (Step 5): remove re-used VO 2 audio to prevent replay
7. **LOW** — Silent orphaned banners (`rs-load`, nav cards): no action unless UX review flags them
