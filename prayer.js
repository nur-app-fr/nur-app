/* ==========================================================================
   NÛR — Horaires de prière (adhan.js)
   ========================================================================== */

const CITIES = [
  { id: 'melun',       name: 'Melun',       lat: 48.5396, lng: 2.6586  },
  { id: 'montargis',   name: 'Montargis',   lat: 47.9979, lng: 2.7430  },
  { id: 'montpellier', name: 'Montpellier', lat: 43.6108, lng: 3.8767  },
  { id: 'orleans',     name: 'Orléans',     lat: 47.9029, lng: 1.9093  },
  { id: 'paris',       name: 'Paris',       lat: 48.8566, lng: 2.3522  },
];

const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const PRAYER_LABELS = {
  fajr:    { ar: 'الفجر',    fr: 'Fajr'    },
  sunrise: { ar: 'الشروق',   fr: 'Chourouq' },
  dhuhr:   { ar: 'الظهر',    fr: 'Dhuhr'   },
  asr:     { ar: 'العصر',    fr: 'Asr'     },
  maghrib: { ar: 'المغرب',   fr: 'Maghrib' },
  isha:    { ar: 'العشاء',   fr: 'Isha'    },
};

const TZ = 'Europe/Paris';

const DEFAULT_SETTINGS = {
  cityId: 'orleans',
  method: 'MuslimWorldLeague',
  madhab: 'Shafi',
  adjustments: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 3, isha: 0 },
};

function loadSettings() {
  try {
    const raw = localStorage.getItem('nur_settings');
    if (!raw) return { ...DEFAULT_SETTINGS, adjustments: { ...DEFAULT_SETTINGS.adjustments } };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      adjustments: { ...DEFAULT_SETTINGS.adjustments, ...(parsed.adjustments || {}) },
    };
  } catch (e) {
    return { ...DEFAULT_SETTINGS, adjustments: { ...DEFAULT_SETTINGS.adjustments } };
  }
}

function saveSettings(settings) {
  localStorage.setItem('nur_settings', JSON.stringify(settings));
}

function getCity(cityId) {
  return CITIES.find(c => c.id === cityId) || CITIES.find(c => c.id === 'orleans');
}

function buildCalculationParams(settings) {
  let params;
  switch (settings.method) {
    case 'Egyptian':
      params = adhan.CalculationMethod.Egyptian();
      break;
    case 'UmmAlQura':
      params = adhan.CalculationMethod.UmmAlQura();
      break;
    case 'Karachi':
      params = adhan.CalculationMethod.Karachi();
      break;
    case 'Custom12':
      params = adhan.CalculationMethod.Other();
      params.fajrAngle = 12;
      params.ishaAngle = 12;
      break;
    case 'Custom15':
      params = adhan.CalculationMethod.Other();
      params.fajrAngle = 15;
      params.ishaAngle = 15;
      break;
    case 'MuslimWorldLeague':
    default:
      params = adhan.CalculationMethod.MuslimWorldLeague();
      break;
  }
  params.madhab = settings.madhab === 'Hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  params.adjustments = { ...params.adjustments, ...settings.adjustments };
  return params;
}

/**
 * Calcule les horaires pour une ville et une date données (objet Date "civil",
 * interprété dans le fuseau Europe/Paris). Retourne un objet de Date (instants
 * UTC corrects) pour fajr / sunrise / dhuhr / asr / maghrib / isha.
 */
function computePrayerTimes(city, date, settings) {
  const coords = new adhan.Coordinates(city.lat, city.lng);
  const params = buildCalculationParams(settings);
  // adhan.js attend une date "calendrier" ; on construit un objet Date à midi UTC
  // pour éviter tout glissement de jour selon le fuseau du navigateur.
  const calcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
  const pt = new adhan.PrayerTimes(coords, calcDate, params);
  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };
}

function formatTime(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
}

function formatDateInput(date) {
  // YYYY-MM-DD en heure de Paris
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const map = {};
  parts.forEach(p => map[p.type] = p.value);
  return `${map.year}-${map.month}-${map.day}`;
}

function parseDateInput(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Détermine la prochaine prière (en tenant compte du jour suivant si l'on est
 * après Isha) pour la ville et les réglages fournis.
 */
function getNextPrayer(city, settings) {
  const now = new Date();
  const today = computePrayerTimes(city, now, settings);

  for (const key of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    if (today[key].getTime() > now.getTime()) {
      return { key, time: today[key] };
    }
  }
  // Toutes les prières du jour sont passées -> Fajr de demain
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next = computePrayerTimes(city, tomorrow, settings);
  return { key: 'fajr', time: next.fajr };
}

function hijriDateString(date) {
  try {
    const fmt = new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    return fmt.format(date) + ' AH (estimation)';
  } catch (e) {
    return '';
  }
}
