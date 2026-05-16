/**
 * Pilgrim's Path — Per-step Reflection Quiz Content (v4)
 * Each question is sourced DIRECTLY from `Hajj voice over.docx.md`.
 * Sections are quoted in the file comments above each step.
 *
 * The runtime (showQuizForCurrentStep in journey-nav.js) shuffles
 * each pool, picks PPQuiz.questionsPerSession (default 5), and
 * shuffles the answer order each session.
 *
 * Question shape: { q, a:[opt0,opt1,opt2,opt3], correct:idx, why }
 * Keyed by HAJJ_JOURNEY step number (1..16).
 */
window.PPQuiz = window.PPQuiz || {};
window.PPQuiz.questionsPerSession = 2;
window.PPQuiz.questions = {

  // ============================================================
  // STEP 1 — Tawaf x7 (initial Umrah Tawaf)
  // Source: voiceover §5 (entering Haram), §6 (sighting Kaaba),
  //         §7 (Tawaf), §8 (du'as), §9 (Yemeni Corner → Black
  //         Stone), §10 (Maqam Ibrahim two rak'ah).
  // ============================================================
  1: [
    { q:"How many times do you circle the Kaaba in Tawaf?", a:["3","5","7","11"], correct:2,
      why:"'Tawaf, circling the Kaaba seven times.'" },
    { q:"From which point do you begin (and end) each circuit of Tawaf?", a:["Maqam Ibrahim","The Yemeni Corner","The Black Stone","The Multazam"], correct:2,
      why:"'Starting from the Black Stone, raise your hand towards it...'" },
    { q:"At the start of each circuit you raise your hand toward the Black Stone and say:", a:["Subhan-Allah","Bismillahi Allahu Akbar","La ilaha illa-Allah","Astaghfirullah"], correct:1,
      why:"'...say Bismillahi Allahu Akbar — In the name of Allah, Allah is the Greatest.'" },
    { q:"When passing between the Yemeni Corner and the Black Stone, the recommended du'a is:", a:["The Talbiyah","'Rabbana atina fi'd-dunya hasanatan...'","Surah al-Fatiha","'Allahu Akbar' three times"], correct:1,
      why:"'Rabbana atina fi dunya hasanatan wa fil akhirati hasanatan wa qina adhaban-nar.'" },
    { q:"Which foot do you step forward with when entering Al-Masjid Al-Haram?", a:["Left","Right","Either","Both together"], correct:1,
      why:"'Step forward with your right foot and recite...'" },
    { q:"After Tawaf, where are two rak'ahs offered?", a:["Hijr Ismail","Maqam Ibrahim (the Station of Ibrahim)","The Multazam","Bab as-Salam"], correct:1,
      why:"'Here at the Maqam Ibrahim, you may offer two rak'ahs of Salah.'" },
    { q:"In the FIRST rak'ah at Maqam Ibrahim, after al-Fatiha you recite:", a:["Surah al-Ikhlas","Surah al-Kafirun","Surah an-Nas","Ayat al-Kursi"], correct:1,
      why:"'In the first rak'ah, recite Surah Al-Fatiha followed by Surah Al-Kafirun.'" },
    { q:"In the SECOND rak'ah at Maqam Ibrahim, after al-Fatiha you recite:", a:["Surah al-Kafirun","Surah al-Ikhlas","Surah al-Mulk","Surah Yasin"], correct:1,
      why:"'In the second rak'ah, recite Surah Al-Fatiha followed by Surah Al-Ikhlas.'" }
  ],

  // ============================================================
  // STEP 2 — Sa'i between Safa and Marwa
  // Source: voiceover §11 (begin at Safa, recitations) and §12
  //         (seven trips, green markers, end at Marwa).
  // ============================================================
  2: [
    { q:"How many times do you walk between Safa and Marwa?", a:["3","5","7","9"], correct:2,
      why:"'...you walk between the two hills seven times.'" },
    { q:"Sa'i begins at which hill?", a:["Marwa","Safa","Mount Arafat","Maqam Ibrahim"], correct:1,
      why:"'Begin at Safa, facing the Kaaba...'" },
    { q:"Standing at Safa, you face which direction?", a:["Toward Marwa","Toward the Kaaba","Toward Madinah","Toward Mount Arafat"], correct:1,
      why:"'Begin at Safa, facing the Kaaba.'" },
    { q:"At Safa you recite the verse:", a:["'Inna as-safa wal-marwata min sha'a'irillah'","Surah al-Fatiha","The Talbiyah","Sayyid al-Istighfar"], correct:0,
      why:"'Indeed, Safa and Marwa are among the symbols of Allah.'" },
    { q:"'Abda'u bima bada'allahu bih' translates as:", a:["'I begin in the name of Allah'","'I begin with that which Allah began with'","'I seek refuge in Allah'","'All praise is for Allah'"], correct:1,
      why:"this is the translation given for the recitation at Safa." },
    { q:"When you reach the green markers, what do you do?", a:["Stop and pray two rak'ahs","Hasten your pace (men only), then walk normally after","Drink Zamzam","Recite Surah al-Fatiha"], correct:1,
      why:"'When you reach the green markers, hasten your pace (men only), then resume walking at a normal pace after passing them.'" },
    { q:"Sa'i is completed when you reach which hill the seventh time?", a:["Safa","Marwa","Maqam Ibrahim","Mount Arafat"], correct:1,
      why:"'Complete Sa'i by reaching Marwa for the seventh time.'" },
    { q:"During Sa'i, what may you recite?", a:["Only the Talbiyah","Dhikr and personal du'as","Only Surah al-Fatiha","Nothing — silence is required"], correct:1,
      why:"'Recite dhikr and personal du'as.'" }
  ],

  // ============================================================
  // STEP 3 — Halaq / Taqsir for Umrah
  // Source: voiceover §13 (Halaq or Qasar) and §14 (Umrah complete).
  // ============================================================
  3: [
    { q:"After completing Sa'i for Umrah, men:", a:["Shave the head OR trim the hair","Only trim a fingertip","Re-enter Ihram","Perform another Tawaf"], correct:0,
      why:"'Men get their heads shaved or trimmed.'" },
    { q:"After completing Sa'i for Umrah, women:", a:["Shave the head","Only trim the hair","Cover the head and not cut","Cut all the hair"], correct:1,
      why:"'Women only get their hair trimmed.'" },
    { q:"What does cutting the hair signify at this point?", a:["Beginning of Ihram","Exiting the boundaries of Ihram","Beginning of Tawaf","Beginning of Sa'i"], correct:1,
      why:"'This now signifies you are out of the boundaries of Ihram.'" },
    { q:"After Halaq/Qasar of Umrah, the pilgrim now waits for:", a:["The 1st of Muharram","The 8th of Dhul-Hijjah","The 27th of Ramadan","The 10th of Muharram"], correct:1,
      why:"'...will await the 8th of Dhul Hajjah.'" },
    { q:"Which act marks completion of Umrah?", a:["Tawaf only","Sa'i only","Halaq or Qasar (after Tawaf and Sa'i)","Stoning the pillars"], correct:2,
      why:"'You have now completed Umrah' — said immediately after the Halaq/Qasar step." },
    { q:"'Halaq' refers to:", a:["Trimming a fingertip","Shaving the head","Combing the hair","Washing the hair"], correct:1,
      why:"men 'get their heads shaved' (Halaq) or 'trimmed' (Qasar)." },
    { q:"'Qasar' (Taqsir) refers to:", a:["Full head shave","Trimming the hair","Bathing","Praying two rak'ahs"], correct:1,
      why:"'Halaq or Qasar' — Halaq = shave, Qasar = trim." },
    { q:"For women, hair cutting is:", a:["A full shave","A small trim of the hair","Forbidden","Optional"], correct:1,
      why:"'women only get their hair trimmed.'" }
  ],

  // ============================================================
  // STEP 4 — Rest & Pray (between Umrah and Hajj)
  // Source: voiceover §13 ('await the 8th of Dhul Hajjah'),
  //         §14 (Umrah complete), §15 (Hajj begins on the 8th).
  // ============================================================
  4: [
    { q:"After Umrah is complete, the pilgrim awaits which day to begin Hajj?", a:["1st of Muharram","8th of Dhul-Hijjah","9th of Dhul-Hijjah","10th of Dhul-Hijjah"], correct:1,
      why:"'will await the 8th of Dhul Hajjah.'" },
    { q:"During this waiting period, the pilgrim is:", a:["Still in Ihram","Out of the boundaries of Ihram","In partial Ihram","Required to fast"], correct:1,
      why:"hair cutting 'signifies you are out of the boundaries of Ihram.'" },
    { q:"What was just completed before this rest period?", a:["Hajj","Umrah","Tawaf al-Ifadah","Tawaf al-Wada"], correct:1,
      why:"'You have now completed Umrah.'" },
    { q:"On the 8th of Dhul-Hijjah the pilgrim heads to:", a:["Madinah","Mina","Arafah directly","Muzdalifah"], correct:1,
      why:"'...You have arrived at Mina where you will spend the day in worship.'" },
    { q:"What is the 8th of Dhul-Hijjah called?", a:["Yawm an-Nahr","Yawm at-Tarwiyah","Yawm 'Arafah","Yawm at-Tashreeq"], correct:1,
      why:"'the 8th day of Dhul-Hijjah, known as Yawm at-Tarwiyah.'" },
    { q:"Recommended use of this rest time:", a:["Travel home","Worship and preparation","Begin Hajj early","Skip prayers"], correct:1,
      why:"The voiceover frames the next stage as worship at Mina; this period is preparation for that." }
  ],

  // ============================================================
  // STEP 5 — Re-enter Ihram (Ihram restrictions + Talbiyah)
  // Source: voiceover §2 (restrictions), §3 (intention + Talbiyah),
  //         §4 (you are now in Ihram).
  // ============================================================
  5: [
    { q:"Men's Ihram garments are described as:", a:["Two seamless white garments","One stitched white robe","Three layered cloths","Black robes"], correct:0,
      why:"'Men must wear only two seamless white garments.'" },
    { q:"What is required of women's Ihram dress?", a:["A specific colour","Modest clothing covering the entire body","Niqab is mandatory","The same two cloths as men"], correct:1,
      why:"'Women should wear modest clothing that covers their entire body.'" },
    { q:"Which of these is FORBIDDEN in Ihram (per the voiceover)?", a:["Drinking water","Applying perfume or scented products","Praying","Reciting the Talbiyah"], correct:1,
      why:"'Do not apply perfume or any scented products.'" },
    { q:"Cutting hair or nails in Ihram is:", a:["Recommended","Forbidden","Required daily","Only forbidden for men"], correct:1,
      why:"'Avoid cutting your hair or nails.'" },
    { q:"Which of these is forbidden in Ihram?", a:["Hunting or killing animals","Praying in congregation","Drinking Zamzam","Reciting Quran"], correct:0,
      why:"'Hunting or killing animals is prohibited.'" },
    { q:"Which behaviour must be avoided in Ihram?", a:["Helping fellow pilgrims","Disputes or arguments","Sleeping","Eating dates"], correct:1,
      why:"'Avoid disputes or arguments.'" },
    { q:"After donning Ihram, you make the intention and recite:", a:["Surah al-Fatiha","The Talbiyah","Sayyid al-Istighfar","The Adhan"], correct:1,
      why:"'make the intention for Hajj and recite the Talbiyah.'" },
    { q:"How does the Talbiyah begin?", a:["'Bismillah ar-Rahman ar-Rahim'","'Labbayka Allahumma labbayk'","'Subhan-Allah'","'La ilaha illa-Allah'"], correct:1,
      why:"'Labbayka Allahumma labbayk, labbayka la sharika laka labbayk...'" },
    { q:"'Labbayka Allahumma labbayk' means:", a:["'Allah is the Greatest'","'Here I am, O Allah, here I am'","'Praise be to Allah'","'I seek refuge in Allah'"], correct:1,
      why:"'Here I am, O Allah, here I am.'" }
  ],

  // ============================================================
  // STEP 6 — Mina, 8th day Yawm at-Tarwiyah
  // Source: voiceover §15.
  // ============================================================
  6: [
    { q:"What is the 8th of Dhul-Hijjah called?", a:["Yawm an-Nahr","Yawm 'Arafah","Yawm at-Tarwiyah","Yawm at-Tashreeq"], correct:2,
      why:"'...the 8th day of Dhul-Hijjah, known as Yawm at-Tarwiyah.'" },
    { q:"Where do you arrive on the 8th of Dhul-Hijjah?", a:["Arafah","Mina","Muzdalifah","Madinah"], correct:1,
      why:"'You have arrived at Mina where you will spend the day in worship.'" },
    { q:"Arrival at Mina should be:", a:["After Maghrib","Before noon","At midnight","At sunset"], correct:1,
      why:"'arrival is before noon.'" },
    { q:"Which prayers are SHORTENED to two rak'ahs at Mina?", a:["Fajr and Maghrib","Zuhr, Asr, and Isha","Only Zuhr","None"], correct:1,
      why:"'...some are shortened to two rak'ahs the likes of, Zuhr, Asr, & Isha.'" },
    { q:"What should the pilgrim continue to recite throughout the day at Mina?", a:["Only Quran","The Talbiyah","Surah al-Fatiha only","Nothing"], correct:1,
      why:"'Throughout the day, continue reciting the Talbiyah.'" },
    { q:"What is the pilgrim preparing for during the 8th day at Mina?", a:["Tawaf al-Wada","The Day of Arafah","Eid prayer","Travel home"], correct:1,
      why:"'...prepare for the Day of Arafah.'" }
  ],

  // ============================================================
  // STEP 7 — Arafah, 9th day
  // Source: voiceover §16.
  // ============================================================
  7: [
    { q:"On which day is the Day of Arafah?", a:["8th of Dhul-Hijjah","9th of Dhul-Hijjah","10th of Dhul-Hijjah","11th of Dhul-Hijjah"], correct:1,
      why:"'On this day the 9th day, the Day of Arafah...'" },
    { q:"Where have you arrived on the Day of Arafah?", a:["The plains of Arafat","Mina","Muzdalifah","Makkah"], correct:0,
      why:"'we have now arrived on the plains of Arafat.'" },
    { q:"Why is this day described as pivotal?", a:["Because the Kaaba is rebuilt","Because supplications are answered","Because Hajj begins","Because pilgrims fast"], correct:1,
      why:"'this is a pivotal moment, where your supplications are answered.'" },
    { q:"What are pilgrims encouraged to walk toward at Arafah?", a:["The Kaaba","The summit","The Jamarat","The Black Stone"], correct:1,
      why:"'Walk your way to the summit.'" },
    { q:"What is the next destination after Arafah?", a:["Makkah","Mina","Muzdalifah","Madinah"], correct:2,
      why:"'You will now be taken to Muzdalifah.'" }
  ],

  // ============================================================
  // STEP 8 — Muzdalifah
  // Source: voiceover §17 (Maghrib + Isha; pebbles), §18 (rest).
  // ============================================================
  8: [
    { q:"Which two prayers are joined at Muzdalifah?", a:["Zuhr and Asr","Maghrib and Isha","Fajr and Zuhr","Asr and Maghrib"], correct:1,
      why:"'pray Maghrib and Isha together, shortened and combined.'" },
    { q:"How are these prayers called at Muzdalifah?", a:["Two adhans, two iqamahs","One adhan and two iqamahs","One adhan and one iqamah","No adhan"], correct:1,
      why:"'with one Adhan and two Iqamahs.'" },
    { q:"How many pebbles should you collect at Muzdalifah?", a:["7","21","At least 49 or 70","100"], correct:2,
      why:"'collect at least 49 or 70 pebbles for the stoning ritual.'" },
    { q:"What are these pebbles for?", a:["Decoration","The stoning ritual the next day","To throw at the Kaaba","Sa'i"], correct:1,
      why:"'...for the stoning ritual for the next day.'" },
    { q:"Where do you rest at Muzdalifah after collecting pebbles?", a:["Inside a mosque","In a hotel","Under the open sky","On a mountain top"], correct:2,
      why:"'you may now proceed to any resting area under the open sky.'" },
    { q:"Maghrib and Isha at Muzdalifah are described as:", a:["Each at its own time","Shortened and combined","Combined but not shortened","Skipped"], correct:1,
      why:"'shortened and combined.'" }
  ],

  // ============================================================
  // STEP 9 — Rami Jamrah al-Aqabah, 10th day
  // Source: voiceover §19 (Yawm an-Nahr — 4 actions) and §20.
  // ============================================================
  9: [
    { q:"What is the 10th of Dhul-Hijjah called?", a:["Yawm at-Tarwiyah","Yawm an-Nahr","Yawm 'Arafah","Yawm at-Tashreeq"], correct:1,
      why:"'Today is the 10th day, Yawm an-Nahr.'" },
    { q:"On the morning of the 10th, after which prayer do you proceed to the Jamarat?", a:["Maghrib","Fajr","Isha","Zuhr"], correct:1,
      why:"'After completing Fajr prayer, we have now arrived at Rami al-jamarat.'" },
    { q:"How many key actions are listed for the 10th day?", a:["Two","Three","Four","Five"], correct:2,
      why:"Rami, Qurbani, Halaq/Qasar, and travel back to Al-Masjid Al-Haram — four actions." },
    { q:"On the 10th day, which pillar is stoned?", a:["Jamarat al-Ula only","Jamarat al-Wusta only","Jamarat al-Aqabah only","All three pillars"], correct:2,
      why:"'begin by stoning Jamarat al-Aqabah with seven pebbles.'" },
    { q:"How many pebbles are thrown at Jamarat al-Aqabah on the 10th?", a:["3","5","7","21"], correct:2,
      why:"'...with seven pebbles.'" },
    { q:"What is recited with each pebble thrown?", a:["Bismillah","Bismillahi Allahu Akbar","Subhan-Allah","Astaghfirullah"], correct:1,
      why:"'reciting Bismillahi Allahu Akbar with each throw.'" },
    { q:"On the 10th, what is the order of the four actions?", a:["Qurbani → Rami → Halaq → Tawaf","Rami → Qurbani → Halaq → Tawaf al-Ifadah","Halaq → Rami → Qurbani → Tawaf","Tawaf → Rami → Qurbani → Halaq"], correct:1,
      why:"Rami al-Jamarat, then Qurbani, then Shaving/Trimming, then travel back to Al-Masjid Al-Haram for Tawaf al-Ifadah." }
  ],

  // ============================================================
  // STEP 10 — Qurbani, 10th day
  // Source: voiceover §21.
  // ============================================================
  10: [
    { q:"After Rami al-Aqabah on the 10th, what is the next action?", a:["Halaq","Sacrifice (Qurbani)","Tawaf al-Wada","Sleep at Mina"], correct:1,
      why:"'2. Sacrifice (Qurbani).'" },
    { q:"Where do you go to perform the Qurbani?", a:["To the Kaaba","To the merchant","To Mount Arafah","Back to your tent"], correct:1,
      why:"'Make your way to the merchant to perform a sacrificial offering.'" },
    { q:"How is the Qurbani typically arranged according to the voiceover?", a:["You slaughter personally inside the Kaaba","By offering a token, the merchant handles it for you","You skip it","You bring an animal from home"], correct:1,
      why:"'By offering a token, they will handle the Qurbani.'" },
    { q:"To whom is the meat given?", a:["The pilgrim alone","Other pilgrims only","As sadaqa to those most in need","Buried in the desert"], correct:2,
      why:"'...give out the meat as sadaqa in your name to those most in need.'" },
    { q:"The Qurbani is given out as:", a:["Zakat","Sadaqa","Kaffarah","Fitrah"], correct:1,
      why:"'...as sadaqa in your name.'" }
  ],

  // ============================================================
  // STEP 11 — Halaq (head shave for Hajj), 10th day
  // Source: voiceover §22.
  // ============================================================
  11: [
    { q:"On the 10th, after Qurbani, men:", a:["Shave their heads or trim their hair","Only trim a fingertip","Wear new Ihram","Begin Tawaf al-Wada"], correct:0,
      why:"'Men will shave their heads or trim their hair.'" },
    { q:"On the 10th, after Qurbani, women:", a:["Shave the head","Cut a small portion of their hair","Cover the head and not cut","Skip this step"], correct:1,
      why:"'women will cut a small portion of their hair.'" },
    { q:"This step in the voiceover is called:", a:["Tawaf","Sa'i","Shaving or Trimming the Hair","Wuquf"], correct:2,
      why:"'3. Shaving or Trimming the Hair.'" },
    { q:"What follows immediately after the haircut on the 10th?", a:["Sleeping at Mina","Travelling back to Al-Masjid Al-Haram","Returning to Arafah","Tawaf al-Wada"], correct:1,
      why:"'You will now proceed to travel back to Al-Masjid Al-Haram within Makkah.'" },
    { q:"At this stage, men have which two valid choices?", a:["Shave OR trim","Shave only","Trim only","Neither"], correct:0,
      why:"'Men will shave their heads or trim their hair.'" },
    { q:"Women's hair cutting on the 10th is described as:", a:["A full shave","A small portion","Removing all the hair","Forbidden"], correct:1,
      why:"'women will cut a small portion of their hair.'" }
  ],

  // ============================================================
  // STEP 12 — Tawaf al-Ifadah
  // Source: voiceover §23–§24.
  // ============================================================
  12: [
    { q:"After Halaq on the 10th, where do you travel?", a:["Madinah","Back to Al-Masjid Al-Haram in Makkah","Stay at Mina","Mount Arafah"], correct:1,
      why:"'travel back to Al-Masjid Al-Haram within Makkah.'" },
    { q:"What is the name of the Tawaf performed at this stage?", a:["Tawaf al-Qudum","Tawaf al-Ifadah","Tawaf al-Wada","Tawaf an-Nafl"], correct:1,
      why:"'this tawaf is called Tawaf Al-Ifadah.'" },
    { q:"This Tawaf is the pilgrim's:", a:["First Tawaf","Second Tawaf (the first being during Umrah)","Third Tawaf","Final Tawaf"], correct:1,
      why:"'this is the second tawaf you will perform, the first one being the one carried out during umrah.'" },
    { q:"After Tawaf al-Ifadah, where do you return to?", a:["Madinah","Mina","Arafah","Muzdalifah"], correct:1,
      why:"'you'll journey back to Mina to complete the Rami Al-Jamarat rituals.'" },
    { q:"Tawaf al-Ifadah is performed:", a:["Before Arafah","After the haircut on the 10th","Only on the 13th","Before Muzdalifah"], correct:1,
      why:"it follows the haircut and travel back to Al-Masjid Al-Haram." }
  ],

  // ============================================================
  // STEP 13 — Rami all three pillars, 11th day
  // Source: voiceover §25 (back to Mina) and §26 (sequence).
  // ============================================================
  13: [
    { q:"On the 11th day, you stone:", a:["Only Jamarat al-Aqabah","Jamarat al-Ula, then al-Wusta, then al-Aqabah","Only Jamarat al-Wusta","All three in any order"], correct:1,
      why:"sequence is Jamarat al-Ula → al-Wusta → al-Aqabah." },
    { q:"Which pillar is stoned FIRST on the 11th?", a:["Jamarat al-Aqabah","Jamarat al-Wusta","Jamarat al-Ula (first pillar)","None"], correct:2,
      why:"'Jamarat al-Ula (first pillar)' is listed first." },
    { q:"Which pillar is stoned SECOND on the 11th?", a:["Jamarat al-Aqabah","Jamarat al-Wusta (middle pillar)","Jamarat al-Ula","None"], correct:1,
      why:"'Jamarat al-Wusta (middle pillar).'" },
    { q:"Which pillar is stoned LAST on the 11th?", a:["Jamarat al-Aqabah (last and largest pillar)","Jamarat al-Wusta","Jamarat al-Ula","None"], correct:0,
      why:"'Jamarat al-Aqabah (last and largest pillar).'" },
    { q:"How many pebbles are thrown at EACH pillar?", a:["1","3","7","21"], correct:2,
      why:"'Throw seven pebbles one by one.'" },
    { q:"How are the pebbles thrown?", a:["All at once","One by one","In handfuls","By rolling"], correct:1,
      why:"'seven pebbles one by one.'" },
    { q:"What is recited with each throw?", a:["Bismillahi Allahu Akbar","Subhan-Allah","Surah al-Fatiha","La ilaha illa-Allah"], correct:0,
      why:"'while saying \"Bismillahi Allahu Akbar\" with each throw.'" }
  ],

  // ============================================================
  // STEP 14 — Mina nights / 12th-day Rami sequence
  // Source: voiceover §28 (12th-day Rami).
  // ============================================================
  14: [
    { q:"On the 12th day, you again perform the stoning at:", a:["Only Jamarat al-Aqabah","All three pillars","Only Jamarat al-Ula","No pillars"], correct:1,
      why:"'For each pillar... Jamarat al-Ula, Jamarat al-Wusta, Jamarat al-Aqabah.'" },
    { q:"Order of stoning on the 12th:", a:["Aqabah → Wusta → Ula","Ula → Wusta → Aqabah","Wusta → Ula → Aqabah","Random"], correct:1,
      why:"Ula, Wusta, Aqabah." },
    { q:"How many pebbles per pillar on the 12th?", a:["1","3","7","21"], correct:2,
      why:"'Throw seven pebbles at each.'" },
    { q:"What is recited with every throw?", a:["Bismillahi Allahu Akbar","Subhan-Allah","Surah al-Fatiha","La ilaha illa-Allah"], correct:0,
      why:"'saying \"Bismillahi Allahu Akbar\" with every throw.'" },
    { q:"Where are you on the 12th when performing the stoning?", a:["Arafah","Muzdalifah","Mina","Makkah"], correct:2,
      why:"'Once again, you're at Mina and ready to perform the stoning ritual.'" }
  ],

  // ============================================================
  // STEP 15 — 12th-day decision + optional 13th
  // Source: voiceover §29 (Decision to Stay or Leave) and §30–§31.
  // ============================================================
  15: [
    { q:"After completing the stoning on the 12th day, you may choose to:", a:["Leave Mina early for the final Tawaf, OR stay and continue on the 13th","Only stay","Only leave","Neither — you must perform Sa'i again"], correct:0,
      why:"'Leave Mina to perform your final tawaf early. Or remain in Mina to continue the ritual on the 13th day.'" },
    { q:"If you choose to leave on the 12th, what do you do next?", a:["Travel home directly","Perform your final Tawaf","Skip Tawaf al-Wada","Sleep at Muzdalifah"], correct:1,
      why:"'Leave Mina to perform your final tawaf early.'" },
    { q:"If you choose to stay for the 13th, what do you perform?", a:["Sa'i again","Stoning all three pillars again (Ula, Wusta, Aqabah)","Tawaf al-Wada at Mina","Qurbani"], correct:1,
      why:"'13th Day... Rami al-Jamarat... visit each of the three pillars... Ula, Wusta, Aqabah.'" },
    { q:"On the 13th day, how many pebbles per pillar?", a:["3","5","7","21"], correct:2,
      why:"'Throw seven pebbles while saying \"Bismillahi Allahu Akbar\" with each throw.'" },
    { q:"After completing the stoning on the 13th day, the rites of Tashreeq are:", a:["Beginning","Complete","Optional","Postponed"], correct:1,
      why:"'You will now leave Mina for Masjidul-Haram, as you have completed the rites of Tashreeq.'" },
    { q:"After completing your stoning (12th or 13th), where do you head?", a:["Madinah","Mina","Masjid al-Haram (Makkah)","Arafah"], correct:2,
      why:"leave Mina for Masjid al-Haram for the farewell tawaf." }
  ],

  // ============================================================
  // STEP 16 — Tawaf al-Wada (Farewell)
  // Source: voiceover §32–§33.
  // ============================================================
  16: [
    { q:"What is the final Tawaf called?", a:["Tawaf al-Qudum","Tawaf al-Ifadah","Tawaf al-Wada (Farewell Tawaf)","Tawaf an-Nafl"], correct:2,
      why:"'This is considered as the farewell tawaf (Tawaf al-Wada).'" },
    { q:"After completing Tawaf al-Wada, which foot do you exit Al-Masjid Al-Haram with?", a:["Left","Right","Either","Both together"], correct:1,
      why:"'exit Al-Masjid Al-Haram with your right foot.'" },
    { q:"On exit, what do you recite?", a:["The Talbiyah","'Bismillahi wa s-salatu wa s-salamu 'ala rasulillah, Allahumma inni as'aluka min fadlika'","Surah al-Fatiha","'Subhan-Allah'"], correct:1,
      why:"This is the exit du'a recited when leaving Al-Masjid Al-Haram." },
    { q:"The translation of the exit du'a includes the request:", a:["'Forgive my sins'","'I ask You for Your bounty'","'Grant me Paradise'","'Accept my prayer'"], correct:1,
      why:"'...O Allah, I ask You for Your bounty.'" },
    { q:"Tawaf al-Wada is performed:", a:["Before Arafah","Before leaving Makkah, after the rites of Tashreeq","On the 8th of Dhul-Hijjah","At Madinah"], correct:1,
      why:"after leaving Mina, the farewell Tawaf is the final act in Makkah." },
    { q:"What does completing Tawaf al-Wada signify?", a:["The start of Hajj","The completion of Hajj","The start of Umrah","Beginning of Ihram"], correct:1,
      why:"'Congratulations on completing your hajj.'" }
  ]
};

(function(){
  try{
    var totals = {}, grand = 0;
    Object.keys(window.PPQuiz.questions).forEach(function(k){
      var n = window.PPQuiz.questions[k].length;
      totals[k] = n; grand += n;
    });
    console.log('[PPQuiz v4] loaded', totals, 'total=' + grand,
                'perSession=' + window.PPQuiz.questionsPerSession);
  }catch(e){}
})();
