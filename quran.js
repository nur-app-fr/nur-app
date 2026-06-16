/* ==========================================================================
   NÛR — Lecteur du Coran
   Texte (Hafs/Uthmani) + traduction française + translitération via
   api.alquran.cloud. Audio verset par verset via everyayah.com.
   ========================================================================== */

const player = {
  surah: null,
  data: null,
  reciter: 'Abu_Bakr_Ash-Shaatree_128kbps',
  current: 1,
  isPlaying: false,
  loopOne: false,
  loopRange: false,
  rangeStart: 1,
  rangeEnd: 1,
};

let audioEl;

function pad3(n) {
  return String(n).padStart(3, '0');
}

function audioUrl(surah, ayah) {
  return `https://everyayah.com/data/${player.reciter}/${pad3(surah)}${pad3(ayah)}.mp3`;
}

async function fetchSurahData(number) {
  const cacheKey = `nur_surah_${number}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.ayahs && parsed.ayahs.length) return parsed;
    } catch (e) { /* ignore */ }
  }
  const url = `https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,fr.hamidullah,en.transliteration`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('network');
  const json = await res.json();
  const [arEd, frEd, trEd] = json.data;
  const ayahs = arEd.ayahs.map((a, i) => ({
    numberInSurah: a.numberInSurah,
    ar: a.text,
    fr: (frEd && frEd.ayahs[i]) ? frEd.ayahs[i].text : '',
    translit: (trEd && trEd.ayahs[i]) ? trEd.ayahs[i].text : '',
  }));
  const result = { number, ayahs };
  try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch (e) { /* quota */ }
  return result;
}

function renderSurahHeader(number, info) {
  const header = document.getElementById('surah-header');
  const showBismillah = number !== 1;
  header.innerHTML = `
    <div class="ar-name">${info.ar}</div>
    <div class="meta">${info.fr} — « ${info.sens} » · ${info.ayahs} versets</div>
    ${showBismillah ? `<div class="bismillah">${BISMILLAH_AR}</div>` : ''}
  `;
}

function renderAyahList(data) {
  const container = document.getElementById('ayah-list');
  const frags = data.ayahs.map(a => `
    <div class="ayah" id="ayah-${a.numberInSurah}">
      <div class="ar">${a.ar}<span class="num">${a.numberInSurah}</span></div>
      ${a.translit ? `<div class="translit">${escapeHtml(a.translit)}</div>` : ''}
      ${a.fr ? `<div class="fr">${escapeHtml(a.fr)}</div>` : ''}
      <div class="row-actions">
        <button class="act-play" data-ayah="${a.numberInSurah}" aria-label="Écouter ce verset">
          <svg class="i"><use href="#i-play"/></svg> Écouter
        </button>
        <button class="act-loop" data-ayah="${a.numberInSurah}" aria-label="Boucler ce verset">
          <svg class="i"><use href="#i-repeat"/></svg> Boucler
        </button>
      </div>
    </div>
  `);
  container.innerHTML = frags.join('');
}

function updatePlayButton() {
  const btn = document.getElementById('play-main');
  btn.innerHTML = player.isPlaying
    ? '<svg class="i"><use href="#i-pause"/></svg>'
    : '<svg class="i"><use href="#i-play"/></svg>';
}

function updateLoopToggles() {
  document.getElementById('toggle-loop-one').classList.toggle('active', player.loopOne);
  document.getElementById('toggle-loop-range').classList.toggle('active', player.loopRange);
  document.getElementById('range-row').hidden = !player.loopRange;

  document.querySelectorAll('.act-loop').forEach(btn => {
    const n = Number(btn.dataset.ayah);
    btn.classList.toggle('active', player.loopOne && n === player.current);
  });
}

function highlightAyah(num) {
  document.querySelectorAll('.ayah.playing').forEach(el => el.classList.remove('playing'));
  const el = document.getElementById(`ayah-${num}`);
  if (el) {
    el.classList.add('playing');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function playAyah(num) {
  if (!player.data) return;
  const total = player.data.ayahs.length;
  if (num < 1 || num > total) { player.isPlaying = false; updatePlayButton(); return; }
  player.current = num;
  audioEl.src = audioUrl(player.surah, num);
  const p = audioEl.play();
  if (p && p.catch) p.catch(() => { showToast("Lecture audio impossible — vérifiez la connexion."); });
  player.isPlaying = true;
  updatePlayButton();
  updateLoopToggles();
  highlightAyah(num);
}

function togglePlay() {
  if (!player.data) return;
  if (player.isPlaying) {
    audioEl.pause();
    player.isPlaying = false;
    updatePlayButton();
  } else {
    let start = player.current;
    if (player.loopRange) start = player.rangeStart;
    playAyah(start);
  }
}

function onAudioEnded() {
  if (player.loopOne) { playAyah(player.current); return; }
  if (player.loopRange) {
    let next = player.current + 1;
    if (next > player.rangeEnd || next < player.rangeStart) next = player.rangeStart;
    playAyah(next);
    return;
  }
  const total = player.data ? player.data.ayahs.length : 0;
  if (player.current < total) {
    playAyah(player.current + 1);
  } else {
    player.isPlaying = false;
    updatePlayButton();
  }
}

function setReciter(reciter) {
  player.reciter = reciter;
  document.querySelectorAll('#reciter-select button').forEach(b => {
    b.classList.toggle('active', b.dataset.reciter === reciter);
  });
  if (player.isPlaying) playAyah(player.current);
}

function clampRange() {
  const total = player.data ? player.data.ayahs.length : 999;
  const startInput = document.getElementById('range-start');
  const endInput = document.getElementById('range-end');
  let s = Math.max(1, Math.min(total, Number(startInput.value) || 1));
  let e = Math.max(1, Math.min(total, Number(endInput.value) || total));
  if (e < s) e = s;
  startInput.value = s;
  endInput.value = e;
  player.rangeStart = s;
  player.rangeEnd = e;
}

async function openSurah(number) {
  const info = SURAH_INFO[number];
  if (!info) return;

  audioEl.pause();
  player.surah = number;
  player.data = null;
  player.current = 1;
  player.isPlaying = false;
  player.loopOne = false;
  player.loopRange = false;
  player.rangeStart = 1;
  player.rangeEnd = info.ayahs;

  document.getElementById('range-start').value = 1;
  document.getElementById('range-start').max = info.ayahs;
  document.getElementById('range-end').value = info.ayahs;
  document.getElementById('range-end').max = info.ayahs;

  updatePlayButton();
  updateLoopToggles();
  renderSurahHeader(number, info);
  document.getElementById('ayah-list').innerHTML =
    '<div class="loading"><span class="spinner"></span> Chargement du texte…</div>';

  goTo('reader', `${info.fr}`);

  try {
    const data = await fetchSurahData(number);
    if (player.surah !== number) return; // l'utilisateur a changé d'écran pendant le chargement
    player.data = data;
    renderAyahList(data);
  } catch (e) {
    document.getElementById('ayah-list').innerHTML = `
      <div class="empty">
        <svg class="i" style="width:32px;height:32px"><use href="#i-book"/></svg>
        <p>Impossible de charger ce texte.<br>Vérifiez votre connexion puis réessayez.</p>
        <button class="chip" id="retry-fetch">Réessayer</button>
      </div>`;
    document.getElementById('retry-fetch').onclick = () => openSurah(number);
  }
}

/* ============ Rendu de la liste des sourates ============ */

function renderCoranLists() {
  const main = document.getElementById('coran-main-list');
  main.innerHTML = MAIN_SURAHS.map(n => surahListItem(n)).join('');

  const grid = document.getElementById('juz-amma-grid');
  grid.innerHTML = JUZ_AMMA_SURAHS.map(n => surahListItem(n)).join('');

  document.querySelectorAll('[data-surah]').forEach(el => {
    el.addEventListener('click', () => openSurah(Number(el.dataset.surah)));
  });
}

function surahListItem(n) {
  const info = SURAH_INFO[n];
  return `
    <button class="list-item" data-surah="${n}">
      <span class="num">${n}</span>
      <span class="titles">
        <span class="ar">${info.ar}</span><br>
        <span class="fr">${info.fr} · ${info.ayahs} versets</span>
      </span>
      <span class="chev"><svg class="i"><use href="#i-chev"/></svg></span>
    </button>
  `;
}

/* ============ Initialisation ============ */

function initQuran() {
  audioEl = document.getElementById('audio-player');
  audioEl.addEventListener('ended', onAudioEnded);

  document.getElementById('play-main').addEventListener('click', togglePlay);

  document.getElementById('toggle-loop-one').addEventListener('click', () => {
    player.loopOne = !player.loopOne;
    if (player.loopOne) player.loopRange = false;
    updateLoopToggles();
  });

  document.getElementById('toggle-loop-range').addEventListener('click', () => {
    player.loopRange = !player.loopRange;
    if (player.loopRange) {
      player.loopOne = false;
      clampRange();
    }
    updateLoopToggles();
  });

  document.getElementById('range-start').addEventListener('change', clampRange);
  document.getElementById('range-end').addEventListener('change', clampRange);

  document.getElementById('reciter-select').addEventListener('click', e => {
    const btn = e.target.closest('button[data-reciter]');
    if (btn) setReciter(btn.dataset.reciter);
  });

  document.getElementById('ayah-list').addEventListener('click', e => {
    const playBtn = e.target.closest('.act-play');
    const loopBtn = e.target.closest('.act-loop');
    if (playBtn) {
      player.loopRange = false;
      playAyah(Number(playBtn.dataset.ayah));
    } else if (loopBtn) {
      const n = Number(loopBtn.dataset.ayah);
      if (player.loopOne && player.current === n) {
        player.loopOne = false;
      } else {
        player.loopOne = true;
        player.loopRange = false;
        player.current = n;
        if (!player.isPlaying || true) playAyah(n);
      }
      updateLoopToggles();
    }
  });

  renderCoranLists();
}

function pauseQuranAudio() {
  if (audioEl && player.isPlaying) {
    audioEl.pause();
    player.isPlaying = false;
    updatePlayButton();
  }
}
