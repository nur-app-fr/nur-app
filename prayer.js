/* ==========================================================================
   NÛR — Calcul des horaires de prière (algorithme intégré, sans dépendance)
   Méthode : astronomique standard (angle Fajr/Isha configurables)
   ========================================================================== */

const CITIES = [
  { id: 'melun',       name: 'Melun',       lat: 48.5396, lng: 2.6586 },
  { id: 'montargis',   name: 'Montargis',   lat: 47.9979, lng: 2.7430 },
  { id: 'montpellier', name: 'Montpellier', lat: 43.6108, lng: 3.8767 },
  { id: 'orleans',     name: 'Orléans',     lat: 47.9029, lng: 1.9093 },
  { id: 'paris',       name: 'Paris',       lat: 48.8566, lng: 2.3522 },
];

const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const PRAYER_LABELS = {
  fajr:    { ar: 'الفجر',   fr: 'Fajr'     },
  sunrise: { ar: 'الشروق',  fr: 'Chourouq' },
  dhuhr:   { ar: 'الظهر',   fr: 'Dhuhr'    },
  asr:     { ar: 'العصر',   fr: 'Asr'      },
  maghrib: { ar: 'المغرب',  fr: 'Maghrib'  },
  isha:    { ar: 'العشاء',  fr: 'Isha'     },
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
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    const p = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...p, adjustments: { ...DEFAULT_SETTINGS.adjustments, ...(p.adjustments || {}) } };
  } catch(e) { return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); }
}

function saveSettings(s) { localStorage.setItem('nur_settings', JSON.stringify(s)); }
function getCity(id) { return CITIES.find(c => c.id === id) || CITIES[3]; }

/* ── Maths astronomiques ── */
function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }
function fixAngle(a) { return a - 360 * Math.floor(a / 360); }
function fixHour(a)  { return a - 24  * Math.floor(a / 24);  }

function julianDay(year, month, day) {
  if (month <= 2) { year--; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunPosition(jd) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(toRad(g)) + 0.020 * Math.sin(toRad(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const RA = toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L)))) / 15;
  const eqt = q / 15 - fixHour(RA);
  const decl = toDeg(Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(L))));
  return { decl, eqt };
}

function hourAngle(lat, decl, elev) {
  const num = -Math.sin(toRad(elev)) - Math.sin(toRad(lat)) * Math.sin(toRad(decl));
  const den = Math.cos(toRad(lat)) * Math.cos(toRad(decl));
  const cos = num / den;
  if (cos < -1) return 24;
  if (cos >  1) return 0;
  return toDeg(Math.acos(cos)) / 15;
}

function asrHourAngle(lat, decl, shadow) {
  const target = toDeg(Math.atan(1 / (shadow + Math.tan(toRad(Math.abs(lat - decl))))));
  return hourAngle(lat, decl, -target);
}

function methodParams(method) {
  switch(method) {
    case 'Egyptian':         return { fajrAngle: 19.5, ishaAngle: 17.5 };
    case 'UmmAlQura':        return { fajrAngle: 18.5, ishaAngle: 90, ishaMinutes: true };
    case 'Karachi':          return { fajrAngle: 18,   ishaAngle: 18  };
    case 'Custom12':         return { fajrAngle: 12,   ishaAngle: 12  };
    case 'Custom15':         return { fajrAngle: 15,   ishaAngle: 15  };
    case 'MuslimWorldLeague':
    default:                 return { fajrAngle: 18,   ishaAngle: 17  };
  }
}

/**
 * Calcule les horaires pour lat/lng/date (objet Date local).
 * Retourne { fajr, sunrise, dhuhr, asr, maghrib, isha } en objets Date UTC.
 */
function computePrayerTimes(city, date, settings) {
  const { lat, lng } = city;
  const year  = date.getFullYear();
  const month = date.getMonth() + 1;
  const day   = date.getDate();

  const jd  = julianDay(year, month, day) - lng / (15 * 24);
  const sp  = sunPosition(jd);
  const { decl, eqt } = sp;

  // Transit (Dhuhr) en heure UTC
  const tz = 0; // On calcule en UTC, on laisse le navigateur afficher en local
  const transit = 12 + tz - lng / 15 - eqt;

  const mp = methodParams(settings.method);
  const shadowFactor = settings.madhab === 'Hanafi' ? 2 : 1;
  const adj = settings.adjustments || {};

  const fajrHA    = hourAngle(lat, decl, -mp.fajrAngle);
  const sunriseHA = hourAngle(lat, decl, -0.8333);
  const asrHA     = asrHourAngle(lat, decl, shadowFactor);
  const maghribHA = hourAngle(lat, decl, -0.8333);
  const ishaHA    = mp.ishaMinutes
    ? (maghribHA + mp.ishaAngle / 60)  // Umm al-Qura: Isha = Maghrib + 90 min
    : hourAngle(lat, decl, -mp.ishaAngle);

  function toDate(h) {
    const total = h * 60; // minutes since midnight UTC
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setTime(d.getTime() + total * 60000);
    return d;
  }

  const dhuhrH  = transit                        + (adj.dhuhr   || 0) / 60;
  const fajrH   = transit - fajrHA               + (adj.fajr    || 0) / 60;
  const sunH    = transit - sunriseHA;
  const asrH    = transit + asrHA                + (adj.asr     || 0) / 60;
  const magH    = transit + maghribHA             + (adj.maghrib || 0) / 60;
  const ishaH   = mp.ishaMinutes
    ? (transit + maghribHA + mp.ishaAngle / 60)  + (adj.isha    || 0) / 60
    : (transit + ishaHA)                         + (adj.isha    || 0) / 60;

  return {
    fajr:    toDate(fajrH),
    sunrise: toDate(sunH),
    dhuhr:   toDate(dhuhrH),
    asr:     toDate(asrH),
    maghrib: toDate(magH),
    isha:    toDate(ishaH),
  };
}

function formatTime(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
}

function formatDateInput(date) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(date);
  const m = {};
  p.forEach(x => m[x.type] = x.value);
  return `${m.year}-${m.month}-${m.day}`;
}

function parseDateInput(str) {
  const [y, mo, d] = str.split('-').map(Number);
  return new Date(y, mo - 1, d);
}

function getNextPrayer(city, settings) {
  const now   = new Date();
  const today = computePrayerTimes(city, now, settings);
  for (const key of ['fajr','dhuhr','asr','maghrib','isha']) {
    if (today[key] && today[key].getTime() > now.getTime()) return { key, time: today[key] };
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next = computePrayerTimes(city, tomorrow, settings);
  return { key: 'fajr', time: next.fajr };
}

function hijriDateString(date) {
  try {
    return new Intl.DateTimeFormat('fr-FR-u-ca-islamic', { day:'numeric', month:'long', year:'numeric' }).format(date);
  } catch(e) { return ''; }
}
