/* ==========================================================================
   NÛR — Salât al-Janâza & visite du cimetière
   ========================================================================== */

const JANAZA_INTRO = `La prière funéraire (<b>Salât al-Janâza</b>) est une prière collective accomplie
<b>debout</b>, du début à la fin : elle ne comporte ni inclinaison (<i>rukū'</i>) ni prosternation
(<i>sujūd</i>). Elle se compose de <b>4 Takbîr</b> (« Allāhu Akbar »), entrecoupés d'invocations,
et se termine par le salâm. C'est un droit du défunt sur la communauté (<i>farḍ kifâya</i>).`;

const JANAZA_STEPS = [
  {
    title: '1ᵉʳ Takbîr — Intention & Al-Fâtiha',
    desc: "Faire l'intention silencieusement, lever les mains en disant « Allāhu Akbar », puis réciter <b>Al-Fâtiha</b> à voix basse.",
  },
  {
    title: '2ᵉ Takbîr — Prière sur le Prophète ﷺ',
    desc: "Après « Allāhu Akbar », réciter l'As-Ṣalât al-Ibrâhîmiyya :",
    ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ. اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
    translit: "Allāhumma ṣalli 'alā Muḥammad wa 'alā āli Muḥammad, kamā ṣallayta 'alā āli Ibrāhīm, innaka ḥamīdun majīd. Allāhumma bārik 'alā Muḥammad wa 'alā āli Muḥammad, kamā bārakta 'alā āli Ibrāhīm, innaka ḥamīdun majīd",
    fr: "Ô Allah, prie sur Muhammad et sur la famille de Muhammad, comme Tu as prié sur la famille d'Ibrahim ; Tu es digne de louange et de gloire. Ô Allah, bénis Muhammad et la famille de Muhammad, comme Tu as béni la famille d'Ibrahim ; Tu es digne de louange et de gloire.",
    source: 'Rapporté par al-Bûkhârî et Muslim',
  },
  {
    title: '3ᵉ Takbîr — Invocation pour le défunt',
    desc: "Après « Allāhu Akbar », réciter l'invocation pour le défunt (adulte ou enfant) — voir ci-dessous.",
  },
  {
    title: '4ᵉ Takbîr & Salâm',
    desc: "Après « Allāhu Akbar », silence bref, puis terminer par le salâm en tournant la tête à droite (et parfois à gauche) : « As-salāmu ʿalaykum wa raḥmatu-llāh ».",
  },
];

const JANAZA_DUAS = [
  {
    id: 'janaza-adulte',
    title: 'Invocation pour un défunt adulte',
    moment: '3ᵉ Takbîr',
    ar: 'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ، وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ وَوَسِّعْ مَدْخَلَهُ، وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ، وَنَقِّهِ مِنَ الْخَطَايَا كَمَا يُنَقَّى الثَّوْبُ الْأَبْيَضُ مِنَ الدَّنَسِ، وَأَبْدِلْهُ دَارًا خَيْرًا مِنْ دَارِهِ، وَأَهْلًا خَيْرًا مِنْ أَهْلِهِ، وَزَوْجًا خَيْرًا مِنْ زَوْجِهِ، وَأَدْخِلْهُ الْجَنَّةَ، وَأَعِذْهُ مِنْ عَذَابِ الْقَبْرِ وَمِنْ عَذَابِ النَّارِ',
    translit: "Allāhumma-ghfir lahu wa-rḥamhu, wa 'āfihi wa-'fu 'anhu, wa akrim nuzulahu wa wassi' madkhalahu, wa-ghsilhu bi-l-mā'i wa-th-thalji wa-l-barad, wa naqqihi mina-l-khaṭāyā kamā yunaqqā-th-thawbu-l-abyaḍu mina-d-danas, wa abdilhu dāran khayran min dārih, wa ahlan khayran min ahlih, wa zawjan khayran min zawjih, wa adkhilhu-l-jannah, wa a'idhhu min 'adhābi-l-qabri wa min 'adhābi-n-nār",
    fr: "Ô Allah, pardonne-lui et fais-lui miséricorde, accorde-lui la guérison et efface ses fautes. Reçois-le dignement et élargis sa demeure. Purifie-le avec de l'eau, de la neige et de la grêle, et débarrasse-le de ses péchés comme on nettoie un vêtement blanc. Donne-lui en échange une demeure meilleure, une famille meilleure, une épouse meilleure. Fais-le entrer au Paradis, et protège-le du châtiment de la tombe et du Feu.",
    source: 'Rapporté par Muslim',
    note: "Pour une défunte (féminin) : remplacer toutes les terminaisons « -hu/-hi » par « -hā/-hā » : <i>Allāhumma-ghfir lahā wa-rḥamhā, wa 'āfihā wa-'fu 'anhā, wa akrim nuzulahā wa wassi' madkhalahā…</i> jusqu'à la fin.",
  },
  {
    id: 'janaza-enfant',
    title: 'Invocation pour un enfant décédé',
    moment: '3ᵉ Takbîr (à la place de la précédente)',
    ar: 'اللَّهُمَّ اجْعَلْهُ فَرَطًا لِوَالِدَيْهِ، وَسَلَفًا وَذُخْرًا، وَعِظَةً وَاعْتِبَارًا وَشَفِيعًا، وَثَقِّلْ بِهِ مِيزَانَهُمَا، وَأَفْرِغِ الصَّبْرَ عَلَى قُلُوبِهِمَا',
    translit: "Allāhumma-j'alhu faraṭan liwālidayh, wa salafan wa dhukhrā, wa 'iẓatan wa-'tibāran wa shafī'ā, wa thaqqil bihi mīzānahumā, wa afrighi-ṣ-ṣabra 'alā qulūbihimā",
    fr: "Ô Allah, fais de lui un précurseur pour ses parents, une avance de bonnes œuvres, un sujet de méditation et d'intercession. Alourdis par lui leur balance de bonnes actions, et déverse la patience dans leurs cœurs.",
    source: 'Rapporté dans les recueils de du'a (Hiṣn al-Muslim)',
    note: "Pour une fillette : « <i>Allāhumma-j'alhā faraṭan liwālidayhā… wa thaqqil bihā mīzānahumā…</i> »",
  },
];

const CEMETERY_INTRO = `La visite du cimetière est fortement recommandée (<i>mustahabb</i>) : elle rappelle
la mort, renforce la foi et permet d'invoquer Allah pour les défunts.`;

const CEMETERY_DUA = {
  id: 'salutation-cimetiere',
  title: 'Salutation en entrant au cimetière',
  ar: 'السَّلَامُ عَلَيْكُمْ أَهْلَ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ، وَيَرْحَمُ اللَّهُ الْمُسْتَقْدِمِينَ مِنَّا وَالْمُسْتَأْخِرِينَ، وَإِنَّا إِنْ شَاءَ اللَّهُ بِكُمْ لَاحِقُونَ، نَسْأَلُ اللَّهَ لَنَا وَلَكُمُ الْعَافِيَةَ',
  translit: "As-salāmu 'alaykum ahla-d-diyāri mina-l-mu'minīna wa-l-muslimīn, wa yarḥamu-llāhu-l-mustaqdimīna minnā wa-l-musta'khirīn, wa innā in shā'a-llāhu bikum lāḥiqūn, nas'alu-llāha lanā wa lakumu-l-'āfiyah",
  fr: "Que la paix soit sur vous, habitants de ces demeures, croyants et musulmans. Qu'Allah fasse miséricorde à ceux d'entre nous qui sont partis avant et à ceux qui viendront après. Et nous vous rejoindrons, si Allah le veut. Nous demandons à Allah le bien-être pour nous et pour vous.",
  source: "Rapporté par Muslim (hadith de ʿÂ'isha)",
};

const CEMETERY_STEPS = [
  {
    title: 'Entrer avec le pied droit et saluer les défunts',
    desc: "Prononcer la salutation à l'entrée (voir ci-dessus). Marcher avec sérénité, sans élever la voix.",
  },
  {
    title: 'Se placer près de la tombe et invoquer',
    desc: "Se tenir face à la tombe, de préférence du côté du visage du défunt (tête du mort). Réciter des invocations pour lui : pardon, miséricorde, élargissement de la tombe et entrée au Paradis.",
  },
  {
    title: 'Récitation du Coran',
    desc: "Il est recommandé de réciter des sourates sur place (Al-Fâtiha, Al-Ikhlâs, Al-Falaq, An-Nâs, Yâ-Sîn) et de dédier la récompense de la lecture au défunt par une courte invocation : « Allāhumma iblaghi thawāba mā qara'tu ilā ruḥi … » (Ô Allah, fais parvenir la récompense de ce que j'ai récité à l'âme de …).",
  },
  {
    title: 'Invoquer pour le défunt avec ses propres mots',
    desc: "On peut also supplier Allah avec ses propres mots, dans la langue que l'on maîtrise, du fond du cœur. Pour un père, une mère ou un frère : demander leur pardon, leur élévation en degré et le Paradis.",
  },
  {
    title: 'Comportement à éviter',
    desc: "Ne pas marcher sur les tombes, ne pas s'asseoir dessus, ne pas y adosser d'objet. Ne pas pousser des cris ou pleurer de façon incontrôlée. Éviter d'y allumer des bougies ou d'y déposer des fleurs (divergences d'avis, privilégier l'invocation).",
  },
];
