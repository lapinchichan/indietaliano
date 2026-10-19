(() => {
  'use strict';
  const games = Array.isArray(window.INDIETALIANO_GAMES) ? window.INDIETALIANO_GAMES : [];
  const $ = (q) => document.querySelector(q);
  const label = { 'in-revisione':'In revisione', 'da-verificare': 'Da verificare', 'in-lavorazione': 'In lavorazione', 'in-test': 'In test', 'disponibile': 'Disponibile' };
  const icons = { road: '↗', haunts: '♠', everholm: '✳', application: '▤' };
  const themes = {road:'rose', haunts:'violet', everholm:'mint', application:'ochre'};
  const list = $('#archive-list');
  let currentFilter = 'all';
  function safeText(s){return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function cards() {
    const search = ($('#game-search').value || '').trim().toLocaleLowerCase('it');
    const filtered = games.filter(g => (currentFilter === 'all' || (g.status === currentFilter && (currentFilter !== 'disponibile' || !g.isDemo))) && `${g.title} ${g.genre} ${g.developer}`.toLocaleLowerCase('it').includes(search));
    list.innerHTML = filtered.map((g) => {
      const status = g.isDemo ? 'Stato da confermare' : (label[g.status] || 'Da verificare');
      const cssStatus = g.isDemo ? 'unknown' : g.status;
      const path = `giochi/${encodeURIComponent(g.id)}.html`;
      const cover = g.coverUrl ? `<img class="item-cover steam-cover" src="${safeText(g.coverUrl)}" ${g.coverFallbackUrl ? `data-backup="${safeText(g.coverFallbackUrl)}"` : ''} alt="" loading="lazy" decoding="async">` : '';
      return `<a class="archive-item" href="${path}" aria-label="Apri la scheda di ${safeText(g.title)}"><span class="item-emblem ${themes[g.accent]||'mint'}" aria-hidden="true"><span class="cover-fallback">${icons[g.accent]||'✳'}</span>${cover}</span><span class="item-title"><strong>${safeText(g.title)}</strong><small>${safeText(g.developer)}</small></span><span class="item-genre">${safeText(g.genre)}</span><span class="item-status ${cssStatus}"><span aria-hidden="true">●</span> ${safeText(status)}</span><span class="item-arrow" aria-hidden="true">↗</span></a>`;
    }).join('');
    list.querySelectorAll('img.steam-cover').forEach(img => {
      img.addEventListener('error', () => {
        const backup = img.dataset.backup;
        if (backup && !img.dataset.backupTried) {
          img.dataset.backupTried = 'true';
          img.src = backup;
        } else {
          img.style.display = 'none';
        }
      });
    });
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
  const toggle=$('#theme-toggle'); const key='indietaliano-color-mode';
  document.documentElement.classList.remove('dark');
  try { if(localStorage.getItem(key)==='light') document.documentElement.classList.add('light'); } catch {}
  function updateTheme(){ toggle.setAttribute('aria-label',document.documentElement.classList.contains('light')?'Attiva la palette verde bottiglia':'Attiva la variante chiara'); }
  toggle.addEventListener('click',()=>{const light=document.documentElement.classList.toggle('light');try{localStorage.setItem(key,light?'light':'dark');}catch{} updateTheme();});
  updateTheme();
  // Testi modificabili da Studio Catalogo, sempre inseriti con textContent (mai HTML utente).
  const copy = window.INDIETALIANO_CONFIG || {};
  const fallbackLines = ['Le storie','più belle','non hanno','barriere.'];
  const headingKeys = ['heroLine1','heroLine2','heroLine3','heroEmphasis'];
  if (headingKeys.some(k => typeof copy[k] === 'string' && copy[k].trim())) {
    const title = $('#hero-title');
    const fragment = document.createDocumentFragment();
    headingKeys.forEach((key,i) => {
      if(i) fragment.appendChild(document.createElement('br'));
      const value = typeof copy[key] === 'string' && copy[key].trim() ? copy[key].trim() : fallbackLines[i];
      if(i === 3){ const em=document.createElement('em');em.textContent=value;fragment.appendChild(em); }
      else fragment.appendChild(document.createTextNode(value));
    });
    title.replaceChildren(fragment);
  }
  for(const [key, selector] of [['introText','.simple-hero-inner > p'],['supportTitle','#support-title'],['supportText','.support-intro p']]){
    const value=copy[key];const target=$(selector);
    if(target && typeof value === 'string' && value.trim()) target.textContent=value.trim();
  }
  const configuredUrl=window.INDIETALIANO_CONFIG?.donationUrl;
  try {const url=new URL(configuredUrl);if(url.protocol==='https:'){const link=$('#donation-link');link.href=url.href;link.hidden=false;$('#donation-pending').hidden=true;}}catch{}
  $('#year').textContent=String(new Date().getFullYear());
  const total=String(games.length);
  if($('#catalog-total'))$('#catalog-total').textContent=total;
  if($('#hero-total'))$('#hero-total').textContent=total;
  cards();
})();
