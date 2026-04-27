/**
 * Per-step quiz content (1–2 short reflection questions per scene).
 * Keyed by HAJJ_JOURNEY step number (1..16).
 * Scenes/contexts not listed are skipped silently.
 */
window.PPQuiz = window.PPQuiz || {};
window.PPQuiz.questions = {
  1: [{ // Tawaf x7
    q: 'How many circuits make up a complete Tawaf?',
    a: ['3','5','7','11'], correct: 2,
    why: 'Tawaf consists of seven circuits around the Kaaba, beginning and ending at the Black Stone (Hajar al-Aswad).'
  }, {
    q: 'In which direction does the pilgrim walk around the Kaaba?',
    a: ['Clockwise','Counter-clockwise','Either direction','Toward the Qibla'], correct: 1,
    why: 'Tawaf is performed counter-clockwise (anti-clockwise), keeping the Kaaba on the pilgrim\'s left.'
  }],
  2: [{ // Sa'i
    q: 'Sa\u02bfi commemorates the search for water by:',
    a: ['Aisha (RA)','Khadijah (RA)','Hajar (AS)','Sarah (AS)'], correct: 2,
    why: 'Sa\u02bfi recalls Hajar (AS) running between Safa and Marwa in search of water for her son Isma\u02bfil (AS).'
  }, {
    q: 'How many times does a pilgrim travel between Safa and Marwa?',
    a: ['3','5','7','9'], correct: 2,
    why: 'Pilgrims complete seven trips (one-way each), starting at Safa and ending at Marwa.'
  }],
  3: [{ // Trim hair (Umrah)
    q: 'After completing Sa\u02bfi for Umrah, men typically:',
    a: ['Shave or trim hair','Pray two rak\u02bfat','Drink Zamzam','Perform another Tawaf'], correct: 0,
    why: 'Halaq (shaving) or taqsir (trimming) marks the completion of Umrah and exit from Ihram.'
  }],
  4: [{ // Rest
    q: 'Between Umrah and Hajj rituals, pilgrims commonly:',
    a: ['Travel home','Rest, pray, and prepare','Begin Tawaf again','Visit Madinah immediately'], correct: 1,
    why: 'In Hajj al-Tamattu\u02bf the pilgrim rests, prays, and prepares spiritually before re-entering Ihram on the 8th of Dhul-Hijjah.'
  }],
  5: [{ // Re-enter Ihram
    q: 'On which day of Dhul-Hijjah does the pilgrim re-enter Ihram for Hajj?',
    a: ['7th','8th','9th','10th'], correct: 1,
    why: 'Pilgrims enter Ihram for Hajj on the 8th of Dhul-Hijjah \u2014 Yawm at-Tarwiyah \u2014 before heading to Mina.'
  }],
  6: [{ // Mina (8th day)
    q: 'What is the 8th of Dhul-Hijjah called?',
    a: ['Yawm an-Nahr','Yawm \u02bbArafah','Yawm at-Tarwiyah','Yawm at-Tashreeq'], correct: 2,
    why: 'The 8th is Yawm at-Tarwiyah (Day of Watering) \u2014 historically the day of preparing water for the journey.'
  }],
  7: [{ // Arafah
    q: 'Standing at \u02bbArafah is:',
    a: ['Recommended (sunnah)','The pillar of Hajj \u2014 without it Hajj is invalid','Optional','Only required for women'], correct: 1,
    why: 'Wuquf at \u02bbArafah is the essential pillar of Hajj. The Prophet \uFDFA said: "Hajj is \u02bbArafah."'
  }, {
    q: 'What is the time of \u02bbArafah?',
    a: ['Fajr to sunrise','Noon to sunset on the 9th','Sunset on the 9th to dawn','All day on the 10th'], correct: 1,
    why: 'Standing begins after Dhuhr on the 9th of Dhul-Hijjah and continues until sunset.'
  }],
  8: [{ // Muzdalifah
    q: 'At Muzdalifah, pilgrims typically:',
    a: ['Perform Tawaf','Stone the pillars','Spend the night and gather pebbles','Slaughter animals'], correct: 2,
    why: 'After Maghrib + \u02bbIsha combined, pilgrims spend the night at Muzdalifah and collect pebbles for Rami.'
  }],
  9: [{ // Aqabah
    q: 'On the 10th of Dhul-Hijjah, how many pebbles are thrown at Jamrah al-\u02bbAqabah?',
    a: ['3','7','11','21'], correct: 1,
    why: 'Only the largest pillar (Aqabah) is stoned on the 10th \u2014 with seven pebbles, one at a time.'
  }],
  10: [{ // Qurbani
    q: 'The Qurbani (sacrifice) commemorates:',
    a: ['The flight from Makkah to Madinah','Ibrahim\u2019s (AS) willingness to sacrifice his son','The conquest of Makkah','The first revelation'], correct: 1,
    why: 'It honors Ibrahim (AS)\u2019s submission and Allah\u2019s ransom of Isma\u02bfil (AS) with a ram.'
  }],
  11: [{ // Halaq
    q: 'After Qurbani, men complete the rituals by:',
    a: ['Shaving (halaq) or trimming (taqsir)','Performing another Sa\u02bfi','Standing at \u02bbArafah','Drinking Zamzam'], correct: 0,
    why: 'Halaq or taqsir marks the partial exit from Ihram. Halaq (full shave) is more meritorious for men.'
  }],
  12: [{ // Tawaf al-Ifadha
    q: 'Tawaf al-Ifadha is:',
    a: ['Recommended','A pillar of Hajj \u2014 mandatory','Only for women','Performed before Arafah'], correct: 1,
    why: 'Tawaf al-Ifadha (also called Tawaf az-Ziyarah) is one of the pillars of Hajj.'
  }],
  13: [{ // Day 11
    q: 'On the 11th day, how many pebbles total are thrown across all three pillars?',
    a: ['7','14','21','30'], correct: 2,
    why: '7 at each of the three Jamarat \u2014 Sughra, Wusta, and Aqabah \u2014 in that order.'
  }],
  14: [{ // Mina night 12
    q: 'During the days of Tashreeq, the pilgrim spends nights at:',
    a: ['Makkah','Muzdalifah','Mina','Madinah'], correct: 2,
    why: 'Spending the nights of the 11th and 12th at Mina is wajib (obligatory).'
  }],
  15: [{ // Day 12
    q: 'A pilgrim leaving Mina on the 12th must depart:',
    a: ['Before Fajr','Before sunset (Maghrib)','After \u02bbIsha','Any time on the 13th'], correct: 1,
    why: 'If you wish to leave on the 12th (Nafr Awwal), you must depart Mina before Maghrib \u2014 otherwise you must stay for the 13th.'
  }],
  16: [{ // Farewell Tawaf
    q: 'Tawaf al-Wida (Farewell Tawaf) is performed:',
    a: ['Before Arafah','As the final act before leaving Makkah','Only on the 9th','At Madinah'], correct: 1,
    why: 'It is the farewell circumambulation \u2014 the last act before leaving Makkah after Hajj.'
  }]
};
console.log('[PPQuiz] questions loaded for ' + Object.keys(window.PPQuiz.questions).length + ' steps');
