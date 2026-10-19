(() => {
  'use strict';
  const games = Array.isArray(window.INDIETALIANO_GAMES) ? window.INDIETALIANO_GAMES : [];
  const $ = (q) => document.querySelector(q);
  const label = { 'da-verificare': 'Da verificare', 'in-lavorazione': 'In lavorazione', 'in-test': 'In test', 'disponibile': 'Disponibile' };
  const icons = { road: '↗', haunts: '♠', everholm: '✳', application: '▤' };
  const themes = {road:'rose', haunts:'violet', everholm:'mint', application:'ochre'};
  const list = $('#archive-list');
  let currentFilter = 'all';
  function safeText(s){return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function cards() {
    const search = ($('#game-search').value || '').trim().toLocaleLowerCase('it');
    const filtered = games.filter(g => (currentFilter === 'all' || (g.status === currentFilter && (currentFilter !== 'disponibile' || !g.isDemo))) && `${g.title} ${g.genre} ${g.developer}`.toLocaleLowerCase('it').includes(search));
    list.innerHTML = filtered.map((g) => {
      const num = String(games.indexOf(g) + 1).padStart(2,'0');
      const status = g.isDemo ? 'Stato da confermare' : (label[g.status] || 'Da verificare');
      const cssStatus = g.isDemo ? 'unknown' : g.status;
      const path = `giochi/${encodeURIComponent(g.id)}.html`;
      return `<a class="archive-item" href="${path}" aria-label="Apri la scheda di ${safeText(g.title)}"><span class="item-num">${num}</span><span class="item-emblem ${themes[g.accent]||'mint'}" aria-hidden="true">${icons[g.accent]||'✳'}</span><span class="item-title"><strong>${safeText(g.title)}</strong><small>${safeText(g.developer)}</small></span><span class="item-genre">${safeText(g.genre)}</span><span class="item-status ${cssStatus}"><span aria-hidden="true">●</span> ${safeText(status)}</span><span class="item-arrow" aria-hidden="true">↗</span></a>`;
    }).join('');
    $('#archive-count').textContent = `${filtered.length} ${filtered.length===1?'TITOLO':'TITOLI'} IN VISTA`;
    $('#empty-message').hidden = filtered.length !== 0;
    list.hidden = filtered.length === 0;
  }
  $('#game-search').addEventListener('input', cards);
  document.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(other => {
      const active=other===btn;
      other.classList.toggle('is-active', active);other.setAttribute('aria-pressed',String(active));
    });
    cards();
  }));
  $('#reset-search').addEventListener('click', () => {$('#game-search').value='';document.querySelector('[data-filter="all"]').click();$('#game-search').focus();});
  const toggle=$('#theme-toggle');const key='indietaliano-theme';
  try {if(localStorage.getItem(key)==='dark')document.documentElement.classList.add('dark');} catch {}
  function updateTheme(){toggle.setAttribute('aria-label', document.documentElement.classList.contains('dark')?'Attiva tema chiaro':'Attiva tema scuro');}
  toggle.addEventListener('click',()=>{const dark=document.documentElement.classList.toggle('dark');try{localStorage.setItem(key,dark?'dark':'light');}catch{}updateTheme();});
  updateTheme();
  const configuredUrl=window.INDIETALIANO_CONFIG?.donationUrl;
  try {const url=new URL(configuredUrl);if(url.protocol==='https:'){const link=$('#donation-link');link.href=url.href;link.hidden=false;$('#donation-pending').hidden=true;}}catch{}
  $('#year').textContent=String(new Date().getFullYear());
  cards();
})();
