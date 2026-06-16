/* ==========================================================================
   NÛR — Horaires de prière via API Aladhan (gratuit, sans clé)
   Gère correctement les hautes latitudes (France en été)
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
  fajr:    { ar: 'الفجر',  fr: 'Fajr'     },
  sunrise: { ar: 'الشروق', fr: 'Chourouq' },
  dhuhr:   { ar: 'الظهر',  fr: 'Dhuhr'    },
  asr:     { ar: 'العصر',  fr: 'Asr'      },
  maghrib: { ar: 'المغرب', fr: 'Maghrib'  },
  isha:    { ar: 'العشاء', fr: 'Isha'     },
};

const TZ = 'Europe/Paris';

const DEFAULT_SETTINGS = {
  cityId: 'orleans',
  method: '3',       // Aladhan method codes
  madhab: 'Shafi',
  adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 3, isha: 0 },
};

/* Méthodes Aladhan :
   2 = ISNA, 3 = MWL (Ligue Islamique Mondiale), 4 = Umm al-Qura,
   5 = Egyptian, 12 = Gulf (Dubaï), 99 = Custom */
const METHODS = [
  { value: '3',  label: 'Ligue Islamique Mondiale' },
  { value: '5',  label: 'Égyptienne' },
  { value: '4',  label: 'Umm al-Qura' },
  { value: '2',  label: 'ISNA (Amérique du Nord)' },
  { value: '12', label: 'Gulf / Dubaï' },
];

function loadSettings() {
  try {
    const raw = localStorage.getItem('nur_settings');
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    const p = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS, ...p,
      adjustments: { ...DEFAULT_SETTINGS.adjustments, ...(p.adjustments || {}) }
    };
  } catch(e) { return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); }
}

function saveSettings(s) { localStorage.setItem('nur_settings', JSON.stringify(s)); }
function getCity(id) { return CITIES.find(c => c.id === id) || CITIES[3]; }

/* ── Cache local (localStorage) pour limiter les appels réseau ── */
function cacheKey(city, dateStr, method, madhab) {
  return `nur_pt_${city.id}_${dateStr}_${method}_${madhab}`;
}

function cachedTimes(city, dateStr, settings) {
  try {
    const raw = localStorage.getItem(cacheKey(city, dateStr, settings.method, settings.madhab));
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function cacheTimes(city, dateStr, settings, data) {
  try {
    localStorage.setItem(cacheKey(city, dateStr, settings.method, settings.madhab), JSON.stringify(data));
  } catch(e) {}
}

/* ── Construction de l'URL Aladhan ── */
function aladhanUrl(city, dateStr, settings) {
  const adj = settings.adjustments || {};
  // tune = fajr,sunrise,dhuhr,asr,sunset,maghrib,isha,midnight,imsak (en minutes)
  const tune = [
    adj.fajr    || 0,
    adj.sunrise || 0,
    adj.dhuhr   || 0,
    adj.asr     || 0,
    0,
    adj.maghrib || 3,
    adj.isha    || 0,
    0, 0
  ].join(',');
  const school = settings.madhab === 'Hanafi' ? 1 : 0; // 0=Shafi, 1=Hanafi
  // latitudeAdjustmentMethod=3 = 1/7 de nuit (recommandé pour France)
  return `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${city.lat}&longitude=${city.lng}&method=${settings.method}&school=${school}&tune=${tune}&latitudeAdjustmentMethod=3`;
}

/* ── Récupération des horaires (async) ── */
async function fetchPrayerTimes(city, date, settings) {
  const dateStr = formatDateInput(date);
  const cached  = cachedTimes(city, dateStr, settings);
  if (cached) return cached;

  const url = aladhanUrl(city, dateStr, settings);
  const res  = await fetch(url);
  if (!res.ok) throw new Error('Aladhan API error ' + res.status);
  const json = await res.json();
  if (json.code !== 200) throw new Error('Aladhan: ' + json.status);

  const t = json.data.timings;
  // Aladhan retourne des horaires en heure locale (Paris)
  // On construit des objets Date UTC correspondants
  const result = {};
  const [y, mo, d] = dateStr.split('-').map(Number);
  for (const key of PRAYER_KEYS) {
    const apiKey = {
      fajr:'Fajr', sunrise:'Sunrise', dhuhr:'Dhuhr',
      asr:'Asr', maghrib:'Maghrib', isha:'Isha'
    }[key];
    const [hh, mm] = t[apiKey].split(':').map(Number);
    // Reconstruit un timestamp UTC à partir de l'heure Paris
    const parisStr = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`;
    // Convertit heure Paris -> UTC via Intl
    const localDate = new Date(parisStr);
    // Astuce : on crée la date comme si c'était UTC, puis on corrige avec l'offset Paris
    const offset = getParisOffsetMin(new Date(Date.UTC(y, mo-1, d, hh, mm)));
    result[key] = new Date(localDate.getTime() - offset * 60000);
  }

  cacheTimes(city, dateStr, settings, result);
  return result;
}

function getParisOffsetMin(utcDate) {
  // Retourne l'offset Paris en minutes (ex: 120 en été, 60 en hiver)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    hour: 'numeric', minute: 'numeric', hour12: false
  }).formatToParts(utcDate);
  const partsUTC = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: 'numeric', minute: 'numeric', hour12: false
  }).formatToParts(utcDate);
  const ph = parseInt(parts.find(p=>p.type==='hour').value);
  const pm = parseInt(parts.find(p=>p.type==='minute').value);
  const uh = parseInt(partsUTC.find(p=>p.type==='hour').value);
  const um = parseInt(partsUTC.find(p=>p.type==='minute').value);
  return (ph*60+pm) - (uh*60+um);
}

/* ── Version synchrone avec cache uniquement (fallback offline) ── */
function computePrayerTimes(city, date, settings) {
  // Appelée en synchrone : retourne le cache si dispo, sinon null
  const dateStr = formatDateInput(date);
  return cachedTimes(city, dateStr, settings);
}

/* ── Utilitaires dates ── */
function formatTime(date) {
  if (!date) return '--:--';
  return date.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', timeZone: TZ });
}

function formatDateInput(date) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit'
  }).formatToParts(date);
  const m = {};
  p.forEach(x => m[x.type] = x.value);
  return `${m.year}-${m.month}-${m.day}`;
}

function parseDateInput(str) {
  const [y, mo, d] = str.split('-').map(Number);
  return new Date(y, mo-1, d);
}

function getNextPrayer(city, settings) {
  const now     = new Date();
  const dateStr = formatDateInput(now);
  const cached  = cachedTimes(city, dateStr, settings);
  if (!cached) return null;
  for (const key of ['fajr','dhuhr','asr','maghrib','isha']) {
    if (cached[key] && cached[key] > now) return { key, time: cached[key] };
  }
  // Demain
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tStr   = formatDateInput(tomorrow);
  const nextDay = cachedTimes(city, tStr, settings);
  if (nextDay && nextDay.fajr) return { key: 'fajr', time: nextDay.fajr };
  return null;
}

function hijriDateString(date) {
  try {
    return new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {
      day:'numeric', month:'long', year:'numeric'
    }).format(date);
  } catch(e) { return ''; }
}
