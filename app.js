/* ==========================================================================
   NÛR — Application principale
   Navigation, accueil (countdown prière), horaires de prière
   ========================================================================== */

/* ─────────────── Navigation ─────────────── */

const SCREENS = ['home', 'horaires', 'coran', 'dua', 'adhkar', 'janaza', 'reader'];
const SCREEN_TITLES = {
  home: '',
  horaires: 'Horaires de prière',
  coran: 'Le Coran',
  dua: "Du'a",
  adhkar: 'Adhkâr',
  janaza: 'Janaza',
  reader: '',
};

let currentScreen = 'home';
let screenStack = [];

function goTo(screenId, title = '') {
  SCREENS.forEach(id => {
    const el = document.getElementById(`screen-${id}`);
    if (el) el.hidden = id !== screenId;
  });

  const brandBlock = document.getElementById('brand-block');
  const screenTitle = document.getElementById('screen-title');
  const backBtn = document.getElementById('btn-back');

  if (screenId === 'home') {
    brandBlock.hidden = false;
    screenTitle.hidden = true;
    backBtn.hidden = true;
    screenStack = [];
  } else {
    brandBlock.hidden = true;
    screenTitle.hidden = false;
    screenTitle.textContent = title || SCREEN_TITLES[screenId] || '';
    backBtn.hidden = false;
  }

  if (currentScreen !== screenId) {
    screenStack.push(currentScreen);
  }
  currentScreen = screenId;

  // Sync bottom nav
  document.querySelectorAll('.bottom-nav button[data-go]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.go === screenId);
  });

  // Stop audio when leaving reader
  if (screenId !== 'reader') {
    pauseQuranAudio && pauseQuranAudio();
  }

  window.scrollTo(0, 0);
}

function goBack() {
  if (screenStack.length) {
    const prev = screenStack.pop();
    currentScreen = ''; // force allow
    goTo(prev, SCREEN_TITLES[prev] || '');
    screenStack.pop(); // goTo pushed current again, clean up
  } else {
    goTo('home');
  }
}

/* ─────────────── Toast ─────────────── */

function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

/* ─────────────── Accueil ─────────────── */

let countdownInterval;
let homeSettings;

function startHomeCountdown() {
  homeSettings = loadSettings();
  const city = getCity(homeSettings.cityId);
  document.getElementById('home-city').textContent = city.name;
  updateCountdown(city, homeSettings);
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => updateCountdown(city, homeSettings), 1000);
}

function updateCountdown(city, settings) {
  const { key, time } = getNextPrayer(city, settings);
  const now = new Date();
  const diff = time.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  const pad = n => String(n).padStart(2, '0');

  document.getElementById('next-prayer-name').textContent = PRAYER_LABELS[key]?.fr || key;
  document.getElementById('next-prayer-countdown').textContent = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  document.getElementById('next-prayer-time').textContent = formatTime(time);

  // Date hijri
  const hijri = document.getElementById('hijri-date');
  const hijriStr = hijriDateString(now);
  if (hijriStr) hijri.textContent = hijriStr;

  // Salutation selon l'heure Paris
  const h = parseInt(new Intl.DateTimeFormat('fr', { hour: 'numeric', hour12: false, timeZone: 'Europe/Paris' }).format(now));
  const greetingEl = document.getElementById('greeting');
  if (h >= 5 && h < 12) greetingEl.textContent = 'Ṣabāḥ al-khayr – Bonjour';
  else if (h >= 12 && h < 18) greetingEl.textContent = 'As-salāmu ʿalaykum';
  else greetingEl.textContent = 'Masā al-khayr – Bonsoir';
}

/* ─────────────── Horaires ─────────────── */

let horairesDate = new Date();
let horairesSettings;

function initHoraires() {
  horairesSettings = loadSettings();

  // Chips villes
  const cityRow = document.getElementById('city-row');
  cityRow.innerHTML = CITIES.map(c => `
    <button class="chip ${c.id === horairesSettings.cityId ? 'active' : ''}" data-city="${c.id}">${c.name}</button>
  `).join('');
  cityRow.querySelectorAll('[data-city]').forEach(btn =>
    btn.addEventListener('click', () => {
      horairesSettings.cityId = btn.dataset.city;
      saveSettings(horairesSettings);
      cityRow.querySelectorAll('[data-city]').forEach(b =>
        b.classList.toggle('active', b.dataset.city === horairesSettings.cityId)
      );
      renderPrayerTable();
    })
  );

  // Date input
  const dateInput = document.getElementById('date-input');
  horairesDate = new Date();
  dateInput.value = formatDateInput(horairesDate);
  dateInput.addEventListener('change', () => {
    horairesDate = parseDateInput(dateInput.value);
    renderPrayerTable();
  });
  document.getElementById('date-prev').addEventListener('click', () => {
    horairesDate.setDate(horairesDate.getDate() - 1);
    dateInput.value = formatDateInput(horairesDate);
    renderPrayerTable();
  });
  document.getElementById('date-next').addEventListener('click', () => {
    horairesDate.setDate(horairesDate.getDate() + 1);
    dateInput.value = formatDateInput(horairesDate);
    renderPrayerTable();
  });
  document.getElementById('btn-today').addEventListener('click', () => {
    horairesDate = new Date();
    dateInput.value = formatDateInput(horairesDate);
    renderPrayerTable();
  });

  // Réglages de calcul
  ['set-method', 'set-madhab', 'adj-fajr', 'adj-dhuhr', 'adj-asr', 'adj-maghrib', 'adj-isha'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      horairesSettings.method = document.getElementById('set-method').value;
      horairesSettings.madhab = document.getElementById('set-madhab').value;
      horairesSettings.adjustments = {
        fajr:    Number(document.getElementById('adj-fajr').value)    || 0,
        dhuhr:   Number(document.getElementById('adj-dhuhr').value)   || 0,
        asr:     Number(document.getElementById('adj-asr').value)     || 0,
        maghrib: Number(document.getElementById('adj-maghrib').value) || 3,
        isha:    Number(document.getElementById('adj-isha').value)    || 0,
      };
      saveSettings(horairesSettings);
      startHomeCountdown();
      renderPrayerTable();
    });
  });

  // Charger les valeurs sauvegardées dans le formulaire
  document.getElementById('set-method').value = horairesSettings.method;
  document.getElementById('set-madhab').value = horairesSettings.madhab;
  document.getElementById('adj-fajr').value    = horairesSettings.adjustments.fajr;
  document.getElementById('adj-dhuhr').value   = horairesSettings.adjustments.dhuhr;
  document.getElementById('adj-asr').value     = horairesSettings.adjustments.asr;
  document.getElementById('adj-maghrib').value = horairesSettings.adjustments.maghrib;
  document.getElementById('adj-isha').value    = horairesSettings.adjustments.isha;

  renderPrayerTable();
}

function renderPrayerTable() {
  horairesSettings = loadSettings();
  const city = getCity(horairesSettings.cityId);
  const times = computePrayerTimes(city, horairesDate, horairesSettings);
  const now = new Date();
  const isToday = formatDateInput(horairesDate) === formatDateInput(now);
  let nextKey = null;

  if (isToday) {
    for (const key of PRAYER_KEYS) {
      if (key === 'sunrise') continue;
      if (times[key] && times[key].getTime() > now.getTime()) {
        nextKey = key;
        break;
      }
    }
  }

  const table = document.getElementById('prayer-table');
  table.innerHTML = PRAYER_KEYS.map(key => {
    const isNext = key === nextKey;
    const label = PRAYER_LABELS[key];
    const time = times[key] ? formatTime(times[key]) : '--:--';
    return `
      <div class="prayer-row ${isNext ? 'next' : ''}">
        <div class="name">
          <span class="dot"></span>
          <span>${label.fr}</span>
          <span class="ar">${label.ar}</span>
        </div>
        <div class="time">${time}</div>
      </div>
    `;
  }).join('');
}

/* ─────────────── Init globale ─────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation clics
  document.querySelectorAll('[data-go]').forEach(el => {
    el.addEventListener('click', () => {
      const dest = el.dataset.go;
      goTo(dest);
      if (dest === 'horaires') initHoraires();
    });
  });

  document.getElementById('btn-back').addEventListener('click', goBack);

  // Init modules
  initQuran();
  initDua();
  initAdhkar();
  initJanaza();
  startHomeCountdown();

  // Démarrer sur l'accueil
  goTo('home');

  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
