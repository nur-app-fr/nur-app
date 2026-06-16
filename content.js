/* ==========================================================================
   NÛR — Rendu des contenus (Du'a, Adhkâr, Janaza)
   ========================================================================== */

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ─────────────── DU'A ─────────────── */

function renderDuaTabs(activeId) {
  const container = document.getElementById('dua-tabs');
  container.innerHTML = DUA_CATEGORIES.map(c => `
    <button class="chip ${c.id === activeId ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>
  `).join('');
  container.querySelectorAll('button').forEach(btn =>
    btn.addEventListener('click', () => renderDuaList(btn.dataset.cat))
  );
}

function renderDuaList(catId) {
  renderDuaTabs(catId);
  const list = DUA_LIST.filter(d => d.category === catId);
  const container = document.getElementById('dua-list');
  if (!list.length) {
    container.innerHTML = '<div class="empty"><p>Aucun du\'a dans cette catégorie.</p></div>';
    return;
  }
  container.innerHTML = list.map(d => duaCard(d)).join('');
}

function duaCard(d) {
  return `
    <div class="dua-card">
      <div class="title">${escapeHtml(d.title)}</div>
      <span class="moment">${escapeHtml(d.moment)}</span>
      ${d.ar ? `<div class="ar">${d.ar}</div>` : ''}
      ${d.translit ? `<div class="translit">${escapeHtml(d.translit)}</div>` : ''}
      ${d.fr ? `<div class="fr">${d.fr}</div>` : ''}
      ${d.note ? `<div class="note">${d.note}</div>` : ''}
      <div class="source">${escapeHtml(d.source || '')}</div>
    </div>
  `;
}

function initDua() {
  renderDuaList('quotidien');
}

/* ─────────────── ADHKÂR ─────────────── */

function renderAdhkarTabs(activeId) {
  const container = document.getElementById('adhkar-tabs');
  container.innerHTML = ADHKAR_CATEGORIES.map(c => `
    <button class="chip ${c.id === activeId ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>
  `).join('');
  container.querySelectorAll('button').forEach(btn =>
    btn.addEventListener('click', () => renderAdhkarList(btn.dataset.cat))
  );
}

function renderAdhkarList(catId) {
  renderAdhkarTabs(catId);
  const list = ADHKAR_LIST.filter(d => d.categories && d.categories.includes(catId));
  const container = document.getElementById('adhkar-list');
  if (!list.length) {
    container.innerHTML = '<div class="empty"><p>Aucun dhikr dans cette catégorie.</p></div>';
    return;
  }
  container.innerHTML = list.map(d => adhkarCard(d)).join('');
}

function adhkarCard(d) {
  let surahLinksHtml = '';
  if (d.surahLinks && d.surahLinks.length) {
    surahLinksHtml = `<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
      ${d.surahLinks.map(n => {
        const info = SURAH_INFO[n];
        return info ? `<button class="chip" data-go-surah="${n}" style="border-color:var(--gold);color:var(--gold-light)">${info.fr}</button>` : '';
      }).join('')}
    </div>`;
  }
  return `
    <div class="dua-card">
      <div class="title">${escapeHtml(d.title)}</div>
      <span class="moment">${escapeHtml(d.moment)}</span>
      ${d.ar ? `<div class="ar">${d.ar}</div>` : ''}
      ${d.translit ? `<div class="translit">${escapeHtml(d.translit)}</div>` : ''}
      ${d.fr ? `<div class="fr">${d.fr}</div>` : ''}
      ${d.note ? `<div class="note">${d.note}</div>` : ''}
      ${surahLinksHtml}
      <div class="source">${escapeHtml(d.source || '')}</div>
    </div>
  `;
}

function initAdhkar() {
  renderAdhkarList('matin');
  document.getElementById('adhkar-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-go-surah]');
    if (btn) openSurah(Number(btn.dataset.goSurah));
  });
}

/* ─────────────── JANAZA ─────────────── */

function janazaDuaBlock(d) {
  return `
    <div class="dua-card" style="margin-top:14px">
      <div class="title">${escapeHtml(d.title)}</div>
      <span class="moment">${escapeHtml(d.moment)}</span>
      ${d.ar ? `<div class="ar">${d.ar}</div>` : ''}
      ${d.translit ? `<div class="translit">${escapeHtml(d.translit)}</div>` : ''}
      ${d.fr ? `<div class="fr">${d.fr}</div>` : ''}
      ${d.note ? `<div class="note">${d.note}</div>` : ''}
      <div class="source">${escapeHtml(d.source || '')}</div>
    </div>
  `;
}

function initJanaza() {
  const container = document.getElementById('janaza-content');

  /* Intro */
  container.innerHTML = `
    <div class="card"><p class="muted" style="margin:0">${JANAZA_INTRO}</p></div>

    <p class="section-title">Déroulement de la prière</p>
    <ol class="steps">
      ${JANAZA_STEPS.map(s => `
        <li>
          <div class="step-body">
            <div class="step-title">${s.title}</div>
            <div class="step-desc">${s.desc}</div>
            ${s.ar ? `<div class="ar" style="font-family:var(--font-arabic);font-size:1.35rem;line-height:2;text-align:right;direction:rtl;margin-top:10px">${s.ar}</div>` : ''}
            ${s.translit ? `<div style="font-size:.85rem;color:var(--gold-light);font-style:italic;margin-top:6px">${escapeHtml(s.translit)}</div>` : ''}
            ${s.fr ? `<div style="font-size:.85rem;color:var(--slate);margin-top:4px">${s.fr}</div>` : ''}
            ${s.source ? `<div style="font-size:.74rem;color:var(--slate);opacity:.75;margin-top:4px">${escapeHtml(s.source)}</div>` : ''}
          </div>
        </li>
      `).join('')}
    </ol>

    <p class="section-title">Invocations du 3ᵉ Takbîr</p>
    ${JANAZA_DUAS.map(d => janazaDuaBlock(d)).join('')}

    <p class="section-title">Visite du cimetière</p>
    <div class="card"><p class="muted" style="margin:0">${CEMETERY_INTRO}</p></div>

    ${janazaDuaBlock(CEMETERY_DUA)}

    <p class="section-title" style="margin-top:20px">Étapes de la visite</p>
    <ol class="steps">
      ${CEMETERY_STEPS.map(s => `
        <li>
          <div class="step-body">
            <div class="step-title">${s.title}</div>
            <div class="step-desc">${s.desc}</div>
          </div>
        </li>
      `).join('')}
    </ol>
  `;
}
