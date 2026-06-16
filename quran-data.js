/* ==========================================================================
   NÛR — Métadonnées des sourates
   (numéro, nom arabe, nom francisé, sens du nom, nombre de versets)
   ========================================================================== */

// Sourates principales demandées, dans l'ordre du Coran (Mushaf)
const MAIN_SURAHS = [1, 18, 36, 55, 67];

// Juz' 'Amma = 30ᵉ partie = sourates 78 à 114
const JUZ_AMMA_SURAHS = Array.from({ length: 114 - 78 + 1 }, (_, i) => 78 + i);

const SURAH_INFO = {
  1:  { ar: 'الفاتحة',     fr: 'Al-Fâtiha',     sens: "L'ouverture",              ayahs: 7   },
  18: { ar: 'الكهف',       fr: 'Al-Kahf',       sens: 'La caverne',               ayahs: 110 },
  36: { ar: 'يس',          fr: 'Yâ-Sîn',        sens: 'Yâ Sîn',                   ayahs: 83  },
  55: { ar: 'الرحمن',      fr: 'Ar-Rahmân',     sens: 'Le Tout Miséricordieux',   ayahs: 78  },
  67: { ar: 'الملك',       fr: 'Al-Mulk',       sens: 'La royauté',               ayahs: 30  },

  78:  { ar: 'النبأ',        fr: 'An-Naba',        sens: 'La nouvelle',                 ayahs: 40 },
  79:  { ar: 'النازعات',     fr: "An-Nâzi'ât",     sens: 'Les anges qui arrachent',     ayahs: 46 },
  80:  { ar: 'عبس',          fr: 'Abasa',          sens: "Il s'est renfrogné",          ayahs: 42 },
  81:  { ar: 'التكوير',      fr: 'At-Takwîr',      sens: "L'enroulement",               ayahs: 29 },
  82:  { ar: 'الإنفطار',     fr: 'Al-Infitâr',     sens: 'La rupture',                  ayahs: 19 },
  83:  { ar: 'المطففين',     fr: 'Al-Mutaffifîn',  sens: 'Les fraudeurs',               ayahs: 36 },
  84:  { ar: 'الانشقاق',     fr: 'Al-Inshiqâq',    sens: 'La déchirure',                ayahs: 25 },
  85:  { ar: 'البروج',       fr: 'Al-Burûj',       sens: 'Les constellations',          ayahs: 22 },
  86:  { ar: 'الطارق',       fr: 'At-Târiq',       sens: 'Astre nocturne',              ayahs: 17 },
  87:  { ar: 'الأعلى',       fr: "Al-A'lâ",        sens: 'Le Très-Haut',                ayahs: 19 },
  88:  { ar: 'الغاشية',      fr: 'Al-Ghâshiya',    sens: "L'enveloppante",              ayahs: 26 },
  89:  { ar: 'الفجر',        fr: 'Al-Fajr',        sens: "L'aube",                      ayahs: 30 },
  90:  { ar: 'البلد',        fr: 'Al-Balad',       sens: 'La cité',                     ayahs: 20 },
  91:  { ar: 'الشمس',        fr: 'Ash-Shams',      sens: 'Le soleil',                   ayahs: 15 },
  92:  { ar: 'الليل',        fr: 'Al-Layl',        sens: 'La nuit',                     ayahs: 21 },
  93:  { ar: 'الضحى',        fr: 'Ad-Duhâ',        sens: 'Le jour montant',             ayahs: 11 },
  94:  { ar: 'الشرح',        fr: 'Ash-Sharh',      sens: "L'ouverture (apaisement)",    ayahs: 8  },
  95:  { ar: 'التين',        fr: 'At-Tîn',         sens: 'Le figuier',                  ayahs: 8  },
  96:  { ar: 'العلق',        fr: "Al-'Alaq",       sens: "L'adhérence",                 ayahs: 19 },
  97:  { ar: 'القدر',        fr: 'Al-Qadr',        sens: 'La destinée',                 ayahs: 5  },
  98:  { ar: 'البينة',       fr: 'Al-Bayyina',     sens: 'La preuve',                   ayahs: 8  },
  99:  { ar: 'الزلزلة',      fr: 'Az-Zalzala',     sens: 'La secousse',                 ayahs: 8  },
  100: { ar: 'العاديات',     fr: "Al-'Âdiyât",     sens: 'Les coursiers',               ayahs: 11 },
  101: { ar: 'القارعة',      fr: "Al-Qâri'a",      sens: 'Le fracas',                   ayahs: 11 },
  102: { ar: 'التكاثر',      fr: 'At-Takâthur',    sens: 'La course aux richesses',     ayahs: 8  },
  103: { ar: 'العصر',        fr: "Al-'Asr",        sens: 'Le temps',                    ayahs: 3  },
  104: { ar: 'الهمزة',       fr: 'Al-Humaza',      sens: 'Les calomniateurs',           ayahs: 9  },
  105: { ar: 'الفيل',        fr: 'Al-Fîl',         sens: "L'éléphant",                  ayahs: 5  },
  106: { ar: 'قريش',         fr: 'Quraysh',        sens: 'Les Quraysh',                 ayahs: 4  },
  107: { ar: 'الماعون',      fr: "Al-Mâ'ûn",       sens: 'Ustensiles / secours',        ayahs: 7  },
  108: { ar: 'الكوثر',       fr: 'Al-Kawthar',     sens: "L'abondance",                 ayahs: 3  },
  109: { ar: 'الكافرون',     fr: 'Al-Kâfirûn',     sens: 'Les infidèles',               ayahs: 6  },
  110: { ar: 'النصر',        fr: 'An-Nasr',        sens: 'Le secours',                  ayahs: 3  },
  111: { ar: 'المسد',        fr: 'Al-Masad',       sens: 'Les fibres',                  ayahs: 5  },
  112: { ar: 'الإخلاص',      fr: 'Al-Ikhlâs',      sens: 'Le monothéisme pur',          ayahs: 4  },
  113: { ar: 'الفلق',        fr: 'Al-Falaq',       sens: "L'aube naissante",            ayahs: 5  },
  114: { ar: 'الناس',        fr: 'An-Nâs',         sens: 'Les hommes',                  ayahs: 6  },
};

const BISMILLAH_AR = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
