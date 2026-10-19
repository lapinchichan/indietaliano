/* Rigenera le schede HTML e il catalogo JSON da content/games/*.json: node build-games.js */
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
// Pages CMS scrive JSON individuali. Il sito statico viene rigenerato da GitHub Actions.
const dataDir=path.join(root,'content','games');
const files=fs.readdirSync(dataDir).filter(f=>f.endsWith('.json')).sort();
if(!files.length) throw Error('Archivio vuoto: aggiungi almeno un gioco in content/games.');
const allowedStatuses=new Set(['in-revisione','da-verificare','in-lavorazione','in-test','disponibile']);
const allowedAccents=new Set(['road','haunts','everholm','application']);
const safeHttps=(value)=>{try {const u=new URL(value);return u.protocol==='https:' && u.hostname.includes('.');}catch{return false;}};
const validGameVersion=(v)=>typeof v==='string' && !!v.trim() && !/^(da confermare|non pubblicata|n\/d|non verificata)$/i.test(v.trim());
const games=files.map((file)=>{
  const data=JSON.parse(fs.readFileSync(path.join(dataDir,file),'utf8'));
  const id=path.basename(file,'.json');
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id!==data.id) throw Error(`Slug errato: ${file}; id deve essere ${id}`);
  if(typeof data.title!=='string'||!data.title.trim()) throw Error('Titolo mancante: '+file);
  if(!allowedStatuses.has(data.status))throw Error('Stato non riconosciuto: '+file);
  for(const field of ['title','developer','genre','description','steamUrl','platform','gameVersion','patchVersion','releaseNotes','downloadUrl','updated']) {
    if(data[field] != null && typeof data[field] !== 'string') throw Error('Tipo errato per '+field+' in '+file);
  }
  if(data.steamUrl && !/^https:\/\/store\.steampowered\.com\/app\/\d+(?:\/[^?#]*)?\/?$/.test(data.steamUrl)) throw Error('URL Steam non valido: '+file);
  if(data.downloadUrl && !safeHttps(data.downloadUrl)) throw Error('Link patch non HTTPS: '+file);
  if(data.isDemo !== true && data.isDemo !== false) throw Error('Conferma stato demo (true/false): '+file);
  for(const field of ['installSteps','screenshots']) {
    if(data[field] != null && (!Array.isArray(data[field]) || !data[field].every(x=>typeof x==='string')))throw Error('Formato non valido per '+field+' in '+file);
  }
  data.installSteps=(data.installSteps||[]).filter(x=>x.trim());
  data.screenshots=(data.screenshots||[]).map(v=>v.replace(/^\//,''));
  // Un selettore del CMS non basta per pubblicare una patch.
  const ready=!data.isDemo && data.patchVerified === true && data.status==='disponibile' && safeHttps(data.downloadUrl) &&
       validGameVersion(data.gameVersion) && validGameVersion(data.patchVersion) && data.installSteps.length>0;
  if(data.status==='disponibile' && !ready) {
    console.warn('Patch non pronta: '+data.title+'; il sito mostrerà "In test".');
    data.status='in-test';
  }
  if (data.patchVerified == null) data.patchVerified=false;
  if (typeof data.patchVerified !== 'boolean') throw Error('Flag collaudo non booleano: '+file);
  if (data.steamAppId != null && !/^\d{3,10}$/.test(String(data.steamAppId))) throw Error('Steam App ID non valido: '+file);
  if (data.steamAppId && data.steamUrl && !data.steamUrl.includes('/app/'+data.steamAppId+'/')) throw Error('App ID diverso da pagina Steam: '+file);
  data.coverUrl=data.steamAppId ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${data.steamAppId}/header.jpg` : '';
  data.order=Number.isFinite(Number(data.order)) ? Number(data.order) : 100;
  data.accent=allowedAccents.has(data.accent)?data.accent:'road';
  return data;
}).sort((a,b)=>a.order-b.order || a.title.localeCompare(b.title,'it'));
// Usare JSON serializzato (mai JavaScript arbitrario) e caratteri sicuri anche nei tag <script>.
const jsData=JSON.stringify(games,null,2).replace(/</g,'\\u003c');
fs.writeFileSync(path.join(root,'games.js'),'window.INDIETALIANO_GAMES = '+jsData+';\n');
const settings=JSON.parse(fs.readFileSync(path.join(root,'content','site.json'),'utf8'));
const donationUrl=typeof settings.donationUrl==='string' && safeHttps(settings.donationUrl) ? settings.donationUrl : '';
fs.writeFileSync(path.join(root,'site-config.js'),'window.INDIETALIANO_CONFIG = '+JSON.stringify({donationUrl},null,2)+';\n');
const esc = (s='') => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusLabel={'in-revisione':'In revisione','da-verificare':'Da verificare','in-lavorazione':'In lavorazione','in-test':'In test','disponibile':'Disponibile'};
const symbol={road:'↗',haunts:'♠',everholm:'✳',application:'▤'};
const safeSteam=(url)=>typeof url==='string' && /^https:\/\/store\.steampowered\.com\/app\/\d+(?:\/[^?#]*)?\/?$/.test(url);
const safeUrl=(url)=>{try {const u=new URL(url);return u.protocol==='https:' && !!u.hostname.includes('.');}catch{return false;}};
const safeImage=(url)=>typeof url==='string' && /^assets\/screenshots\/[a-z0-9/_-]+\.(webp|png|jpg|jpeg)$/i.test(url);
const faq=[
 ['È una traduzione ufficiale?','No, Indietaliano è un progetto indipendente, non affiliato agli sviluppatori o agli editori.'],
 ['Posso scaricare anche il videogioco?','No. Le patch non includono il gioco originale: acquistalo attraverso i canali ufficiali.'],
 ['Perché non c’è il pulsante di download?','Ogni patch va testata prima della pubblicazione. Una scheda nell’archivio non significa che la traduzione sia già pronta.'],
 ['Come mi preparo all’installazione?','Prima di modificare i file, controlla la versione del gioco e fai una copia di sicurezza degli originali.']
];
const faqHtml=faq.map(([question,answer])=>`<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join('');
const outDir=path.join(root,'giochi');fs.mkdirSync(outDir,{recursive:true});
for(const file of fs.readdirSync(outDir)) { if(file.endsWith('.html') && !games.some(g=>file===g.id+'.html'))fs.unlinkSync(path.join(outDir,file)); }
for(const [idx,g] of games.entries()){
 if(!/^[a-z0-9-]+$/.test(g.id))throw Error('ID non valido: '+g.id);
 const available=!g.isDemo && g.patchVerified===true && g.status==='disponibile' && safeUrl(g.downloadUrl) && validGameVersion(g.gameVersion) && validGameVersion(g.patchVersion) && Array.isArray(g.installSteps) && g.installSteps.length>0;
 const demo=!!g.isDemo;
 const status=demo?'Stato da confermare':(statusLabel[g.status]||'Da verificare');
 const steam=safeSteam(g.steamUrl)?`<a class="dossier-steam-link" href="${esc(g.steamUrl)}" target="_blank" rel="noopener noreferrer">Vedi il gioco su Steam <span aria-hidden="true">↗</span></a>`:'';
 const notes=demo ? 'Questa è una scheda preparatoria. Le informazioni sulla traduzione sono ancora da verificare e non implicano che una patch sia già pubblicabile.' : (g.releaseNotes || 'Traduzione italiana in revisione dopo gli aggiornamenti del gioco.');
 const installation=available?`<ol class="install-steps">${g.installSteps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:'<div class="pending-box">La procedura di installazione sarà pubblicata dopo i nuovi test di compatibilità. Per il momento la patch non è scaricabile.</div>';
 const shots=(!demo && Array.isArray(g.screenshots)?g.screenshots:[]).filter(safeImage);
 const steamCover=g.coverUrl?`<img class="dossier-steam-cover steam-cover" src="${esc(g.coverUrl)}" alt="Copertina ufficiale Steam di ${esc(g.title)}" loading="eager" decoding="async">`:'';
 const screenshots=shots.length?`<div class="screens-grid">${shots.map(s=>`<img src="../${esc(s)}" loading="lazy" alt="Screenshot tradotto di ${esc(g.title)}">`).join('')}</div>`:'<div class="pending-box">Le schermate del gioco tradotto compariranno qui dopo la verifica.</div>';
 const props=[['Autore del gioco',g.developer],['Genere',g.genre],['Piattaforma',g.platform],['Versione del gioco',g.gameVersion||'Da confermare'],['Versione della patch',g.patchVersion||'Non pubblicata'],['Stato',status],['Aggiornamento',g.updated||'Da comunicare']].map(([a,b])=>`<div class="fact-row"><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('');
 const download=available?`<a href="${esc(g.downloadUrl)}" target="_blank" rel="noopener noreferrer">Scarica la patch <span aria-hidden="true">↗</span></a><small>Leggi le istruzioni prima di installare la patch.</small>`:'<span class="dossier-not-ready">Nessuna patch disponibile per il download.</span><small>Lo stato e la compatibilità devono essere confermati prima della pubblicazione.</small>';
 const html=`<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#FDFBF7"><meta name="description" content="${esc(g.title)} su Indietaliano: informazioni sulla traduzione italiana, compatibilità e download quando verificato."><meta name="robots" content="noindex,nofollow"><title>${esc(g.title)} · Indietaliano</title><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com">  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&display=swap" rel="stylesheet"><link rel="stylesheet" href="../style.css"><link rel="stylesheet" href="../retro-editorial.css"><link rel="stylesheet" href="../typography.css"><link rel="stylesheet" href="../catalog-v3-7.css?v=371"><script defer src="../detail-page.js"></script></head>
<body><a class="skip-link" href="#contenuto">Vai al contenuto</a>
<header class="masthead"><a class="type-logo" href="../index.html">indie<span>taliano</span><i>.</i></a><nav class="mast-nav" aria-label="Navigazione principale"><a href="../index.html#giochi">Giochi</a><a href="../index.html#sostieni">Sostieni</a><a class="nav-admin" href="../gestione.html">Gestione</a></nav><button id="theme-toggle" type="button" class="theme-button" aria-label="Attiva tema scuro"><span aria-hidden="true">◐</span> <span class="theme-word">Tema</span></button></header>
<div class="dossier-topbar"><span>INDIETALIANO / I PICCOLI MONDI MERITANO PAROLE</span><span>SCHEDA N° ${String(idx+1).padStart(2,'0')} / ${String(games.length).padStart(2,'0')}</span></div>
<main id="contenuto" class="dossier-page">
<a class="dossier-back" href="../index.html#giochi"><span aria-hidden="true">↖</span> Torna all’archivio</a>
<section class="dossier-hero" aria-labelledby="dossier-title"><div class="dossier-copy"><div class="dossier-meta-line"><span>UN GIOCO DA SCOPRIRE</span><span>${esc(status).toUpperCase()}</span></div><h1 class="dossier-title" id="dossier-title">${esc(g.title)}<span aria-hidden="true">.</span></h1><p class="dossier-description">${esc(g.description)}</p></div><div class="dossier-illustration ${esc(g.accent||'road')} ${steamCover?'has-cover':''}"><small>COPERTINA DEL VIDEOGIOCO / STEAM</small><strong aria-hidden="true">${symbol[g.accent]||'✳'}</strong>${steamCover}<span class="illustration-edge">INDIE / IT</span></div></section>
${demo?'<div class="dossier-note" role="note"><span aria-hidden="true">ⓘ</span><div><strong>Scheda in preparazione.</strong> Il gioco è presente nell’archivio, ma lo stato effettivo della traduzione, la sua compatibilità e i file non sono ancora verificati. Nessuna uscita è promessa.</div></div>':'<div class="dossier-note" role="note"><span aria-hidden="true">↻</span><div><strong>Traduzione in revisione.</strong> Gli aggiornamenti del gioco richiedono nuovi test. Il download rimane sospeso finché non sarà verificata la compatibilità.</div></div>'}
<div class="dossier-body"><div class="dossier-articles"><section class="dossier-chapter"><span class="dossier-chapter-name">01 / IL PROGETTO</span><h2>Questa storia,<br>in italiano.</h2><p>${esc(notes)}</p></section><section class="dossier-chapter"><span class="dossier-chapter-name">02 / ISTRUZIONI</span><h2>Prima di giocare.</h2>${installation}</section><section class="dossier-chapter"><span class="dossier-chapter-name">03 / ANTEPRIME</span><h2>Uno sguardo dentro.</h2>${screenshots}</section><section class="dossier-chapter"><span class="dossier-chapter-name">04 / FAQ</span><h2>Le cose da sapere.</h2><div class="dossier-faq">${faqHtml}</div></section></div><aside class="dossier-factbox" aria-label="Informazioni sul gioco"><h2>La scheda, in breve.</h2><dl>${props}</dl><div class="dossier-download"><strong>TRADUZIONE ITALIANA</strong>${download}${steam}</div></aside></div>
<div class="next-story"><div><p>INDIETALIANO / CONTINUA A ESPLORARE</p><h2>C’è sempre un altro<br>mondo da scoprire.</h2></div><a href="../index.html#giochi">Esplora tutti i giochi ↗</a></div></main>
<footer class="footer"><div class="footer-top"><span class="footer-title">indietaliano<span>.</span></span><a href="../index.html#inizio">TORNA ALL'INIZIO ↑</a></div><div class="footer-bottom"><p>Progetto personale non ufficiale. I marchi dei videogiochi appartengono ai rispettivi titolari. Le eventuali patch non comprendono il gioco originale.</p><div class="footer-utilities"><a href="../gestione.html">Area gestione ↗</a><span>© <span id="year">2026</span> INDIETALIANO</span></div></div></footer></body></html>`;
 fs.writeFileSync(path.join(outDir,`${g.id}.html`),html);
 console.log('Generata scheda:',g.title, available ? '(patch verificata)' : '(in revisione, download bloccato)');
}
