/* ==========================================================================
   NÛR — Application principale
   ========================================================================== */

const SCREENS = ['home','horaires','coran','dua','adhkar','janaza','reader'];
const SCREEN_TITLES = {
  home:'', horaires:'Horaires de prière', coran:'Le Coran',
  dua:"Du'a", adhkar:'Adhkâr', janaza:'Janaza', reader:''
};

let currentScreen = 'home';
let screenStack   = [];

function goTo(screenId, title='') {
  SCREENS.forEach(id => {
    const el = document.getElementById(`screen-${id}`);
    if (el) el.hidden = id !== screenId;
  });
  const brandBlock  = document.getElementById('brand-block');
  const screenTitle = document.getElementById('screen-title');
  const backBtn     = document.getElementById('btn-back');

  if (screenId === 'home') {
    brandBlock.hidden  = false;
    screenTitle.hidden = true;
    backBtn.hidden     = true;
    screenStack        = [];
  } else {
    brandBlock.hidden  = true;
    screenTitle.hidden = false;
    screenTitle.textContent = title || SCREEN_TITLES[screenId] || '';
    backBtn.hidden = false;
  }
  if (currentScreen !== screenId) screenStack.push(currentScreen);
  currentScreen = screenId;

  document.querySelectorAll('.bottom-nav button[data-go]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.go === screenId)
  );
  if (screenId !== 'reader') pauseQuranAudio && pauseQuranAudio();
  window.scrollTo(0,0);
}

function goBack() {
  if (screenStack.length) {
    const prev = screenStack.pop();
    currentScreen = '';
    goTo(prev, SCREEN_TITLES[prev]||'');
    screenStack.pop();
  } else { goTo('home'); }
}

function showToast(msg, duration=3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

/* ─────────────── Accueil — countdown ─────────────── */
let countdownInterval = null;

async function startHomeCountdown() {
  const settings = loadSettings();
  const city     = getCity(settings.cityId);
  document.getElementById('home-city').textContent = city.name;

  // Mise à jour de la date hijri
  const hijri = hijriDateString(new Date());
  if (hijri) document.getElementById('hijri-date').textContent = hijri;

  // Précharger aujourd'hui + demain
  const now      = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    await fetchPrayerTimes(city, now, settings);
    await fetchPrayerTimes(city, tomorrow, settings);
  } catch(e) {
    document.getElementById('next-prayer-name').textContent = '—';
    document.getElementById('next-prayer-countdown').textContent = 'Hors ligne';
    return;
  }

  clearInterval(countdownInterval);
  tickCountdown(city, settings);
  countdownInterval = setInterval(() => tickCountdown(city, settings), 1000);
}

function tickCountdown(city, settings) {
  const next = getNextPrayer(city, settings);
  if (!next) return;

  const now  = new Date();
  const diff = next.time.getTime() - now.getTime();
  if (diff < 0) { startHomeCountdown(); return; }

  const h   = Math.floor(diff / 3600000);
  const m   = Math.floor((diff % 3600000) / 60000);
  const s   = Math.floor((diff % 60000) / 1000);
  const pad = n => String(n).padStart(2,'0');

  document.getElementById('next-prayer-name').textContent      = PRAYER_LABELS[next.key]?.fr || next.key;
  document.getElementById('next-prayer-countdown').textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  document.getElementById('next-prayer-time').textContent      = formatTime(next.time);

  // Salutation
  const hr = parseInt(new Intl.DateTimeFormat('fr',{hour:'numeric',hour12:false,timeZone:'Europe/Paris'}).format(now));
  const greet = document.getElementById('greeting');
  if (hr>=5&&hr<12)       greet.textContent = 'Ṣabāḥ al-khayr — Bonjour';
  else if (hr>=12&&hr<18) greet.textContent = 'As-salāmu ʿalaykum';
  else                    greet.textContent = 'Masā al-khayr — Bonsoir';
}

/* ─────────────── Horaires ─────────────── */
let horairesDate     = new Date();
let horairesSettings = null;

function initHoraires() {
  horairesSettings = loadSettings();

  // Chips villes
  const cityRow = document.getElementById('city-row');
  cityRow.innerHTML = CITIES.map(c => `
    <button class="chip ${c.id===horairesSettings.cityId?'active':''}" data-city="${c.id}">${c.name}</button>
  `).join('');
  cityRow.querySelectorAll('[data-city]').forEach(btn =>
    btn.addEventListener('click', () => {
      horairesSettings.cityId = btn.dataset.city;
      saveSettings(horairesSettings);
      cityRow.querySelectorAll('[data-city]').forEach(b =>
        b.classList.toggle('active', b.dataset.city===horairesSettings.cityId)
      );
      loadAndRenderTable();
    })
  );

  // Date
  const dateInput = document.getElementById('date-input');
  horairesDate    = new Date();
  dateInput.value = formatDateInput(horairesDate);
  dateInput.addEventListener('change', () => {
    horairesDate = parseDateInput(dateInput.value);
    loadAndRenderTable();
  });
  document.getElementById('date-prev').addEventListener('click', () => {
    horairesDate.setDate(horairesDate.getDate()-1);
    dateInput.value = formatDateInput(horairesDate);
    loadAndRenderTable();
  });
  document.getElementById('date-next').addEventListener('click', () => {
    horairesDate.setDate(horairesDate.getDate()+1);
    dateInput.value = formatDateInput(horairesDate);
    loadAndRenderTable();
  });
  document.getElementById('btn-today').addEventListener('click', () => {
    horairesDate    = new Date();
    dateInput.value = formatDateInput(horairesDate);
    loadAndRenderTable();
  });

  // Réglages
  ['set-method','set-madhab','adj-fajr','adj-dhuhr','adj-asr','adj-maghrib','adj-isha'].forEach(id => {
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
      loadAndRenderTable();
    });
  });

  // Charger valeurs sauvegardées
  document.getElementById('set-method').value    = horairesSettings.method;
  document.getElementById('set-madhab').value    = horairesSettings.madhab;
  document.getElementById('adj-fajr').value      = horairesSettings.adjustments.fajr    || 0;
  document.getElementById('adj-dhuhr').value     = horairesSettings.adjustments.dhuhr   || 0;
  document.getElementById('adj-asr').value       = horairesSettings.adjustments.asr     || 0;
  document.getElementById('adj-maghrib').value   = horairesSettings.adjustments.maghrib || 3;
  document.getElementById('adj-isha').value      = horairesSettings.adjustments.isha    || 0;

  loadAndRenderTable();
}

async function loadAndRenderTable() {
  const table = document.getElementById('prayer-table');
  table.innerHTML = '<div class="loading"><span class="spinner"></span> Chargement…</div>';

  horairesSettings = loadSettings();
  const city = getCity(horairesSettings.cityId);

  let times;
  try {
    times = await fetchPrayerTimes(city, horairesDate, horairesSettings);
  } catch(e) {
    table.innerHTML = `<div class="empty"><p>Impossible de charger les horaires.<br>Vérifiez votre connexion.</p>
      <button class="chip" id="retry-prayer">Réessayer</button></div>`;
    document.getElementById('retry-prayer').onclick = loadAndRenderTable;
    return;
  }

  const now     = new Date();
  const isToday = formatDateInput(horairesDate) === formatDateInput(now);
  let nextKey   = null;

  if (isToday) {
    for (const key of ['fajr','dhuhr','asr','maghrib','isha']) {
      if (times[key] && times[key] > now) { nextKey = key; break; }
    }
  }

  table.innerHTML = PRAYER_KEYS.map(key => {
    const isNext = key === nextKey;
    const label  = PRAYER_LABELS[key];
    const time   = times[key] ? formatTime(times[key]) : '--:--';
    return `
      <div class="prayer-row ${isNext?'next':''}">
        <div class="name">
          <span class="dot"></span>
          <span>${label.fr}</span>
          <span class="ar">${label.ar}</span>
        </div>
        <div class="time">${time}</div>
      </div>`;
  }).join('');

  // Sync countdown aussi
  startHomeCountdown();
}

/* ─────────────── Init ─────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-go]').forEach(el => {
    el.addEventListener('click', () => {
      const dest = el.dataset.go;
      goTo(dest);
      if (dest === 'horaires') initHoraires();
    });
  });

  document.getElementById('btn-back').addEventListener('click', goBack);

  initQuran();
  initDua();
  initAdhkar();
  initJanaza();
  startHomeCountdown();
  goTo('home');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
});
