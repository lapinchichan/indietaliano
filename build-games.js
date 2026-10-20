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
  for(const field of ['title','developer','genre','description','steamUrl','platform','gameVersion','patchVersion','releaseNotes','downloadUrl','updated','coverImage']) {
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
  // Alcuni nuovi giochi Steam richiedono il percorso versionato del file header.
  // L'hash e' una stringa esadecimale di 40 caratteri, non un URL arbitrario.
  const assetBase=data.steamAppId ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${data.steamAppId}/` : '';
  if (data.steamHeaderHash && !/^[a-f0-9]{40}$/.test(data.steamHeaderHash)) throw Error('Hash copertina Steam non valido: '+file);
  if (data.steamLibraryHash && !/^[a-f0-9]{40}$/.test(data.steamLibraryHash)) throw Error('Hash libreria Steam non valido: '+file);
  const steamCover=assetBase ? assetBase+(data.steamHeaderHash ? data.steamHeaderHash+'/' : '')+'header.jpg' : '';
  const steamFallback=assetBase && data.steamLibraryHash ? assetBase+data.steamLibraryHash+'/library_capsule.jpg' : '';
  const localCover=typeof data.coverImage==='string' ? data.coverImage.replace(/^\//,'') : '';
  if (localCover && !/^assets\/screenshots\/[a-z0-9/_-]+\.(?:webp|png|jpg|jpeg)$/i.test(localCover)) {
    throw Error('Copertina locale non valida: '+file);
  }
  data.coverUrl=localCover || steamCover;
  data.coverFallbackUrl=localCover ? steamCover || steamFallback : steamFallback;
  data.order=Number.isFinite(Number(data.order)) ? Number(data.order) : 100;
  data.accent=allowedAccents.has(data.accent)?data.accent:'road';
  return data;
}).sort((a,b)=>a.order-b.order || a.title.localeCompare(b.title,'it'));
// Usare JSON serializzato (mai JavaScript arbitrario) e caratteri sicuri anche nei tag <script>.
const jsData=JSON.stringify(games,null,2).replace(/</g,'\\u003c');
fs.writeFileSync(path.join(root,'games.js'),'window.INDIETALIANO_GAMES = '+jsData+';\n');
const settings=JSON.parse(fs.readFileSync(path.join(root,'content','site.json'),'utf8'));
const donationUrl=typeof settings.donationUrl==='string' && safeHttps(settings.donationUrl) ? settings.donationUrl : '';
const copyKeys=['heroLine1','heroLine2','heroLine3','heroEmphasis','introText','supportTitle','supportText'];
const editableCopy=Object.fromEntries(copyKeys.map(k=>[k,typeof settings[k]==='string'?settings[k].trim().slice(0,600):'']));
const siteJsData=JSON.stringify({donationUrl,...editableCopy},null,2).replace(/</g,'\\u003c');
fs.writeFileSync(path.join(root,'site-config.js'),'window.INDIETALIANO_CONFIG = '+siteJsData+';\n');
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
 const installation=available?`<section class="dossier-chapter dossier-extra"><span class="dossier-chapter-name">INSTALLAZIONE</span><h2>Prima di giocare.</h2><ol class="install-steps">${g.installSteps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></section>`:'';
 const shots=(!demo && Array.isArray(g.screenshots)?g.screenshots:[]).filter(safeImage);
 const dossierCover=(url)=>url && url.startsWith('assets/') ? '../'+url : url;
 const steamCover=g.coverUrl?`<img class="dossier-steam-cover steam-cover" src="${esc(dossierCover(g.coverUrl))}" ${g.coverFallbackUrl ? `data-backup="${esc(dossierCover(g.coverFallbackUrl))}"` : ''} alt="Copertina di ${esc(g.title)}" loading="eager" decoding="async">`:'';
 const screenshots=shots.length?`<section class="dossier-chapter dossier-extra"><span class="dossier-chapter-name">SCHERMATE DEL GIOCO</span><h2>Uno sguardo dentro.</h2><div class="screens-grid">${shots.map(s=>`<img src="../${esc(s)}" loading="lazy" alt="Screenshot tradotto di ${esc(g.title)}">`).join('')}</div></section>`:'';
 const props=[['Autore del gioco',g.developer],['Genere',g.genre],['Piattaforma',g.platform],['Versione del gioco',g.gameVersion||'Da confermare'],['Versione della patch',g.patchVersion||'Non pubblicata'],['Stato',status],['Aggiornamento',g.updated||'Da comunicare']].map(([a,b])=>`<div class="fact-row"><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('');
 const download=available?`<a href="${esc(g.downloadUrl)}" target="_blank" rel="noopener noreferrer">Scarica la patch <span aria-hidden="true">↗</span></a><small>Leggi le istruzioni prima di installare la patch.</small>`:'<span class="dossier-not-ready">Nessuna patch disponibile per il download.</span><small>Lo stato e la compatibilità devono essere confermati prima della pubblicazione.</small>';
 const displayFacts=[
   ['Autore del gioco',g.developer||'Da confermare'],
   ['Genere',g.genre||'Da confermare'],
   ['Piattaforma',g.platform||'PC (Steam)'],
   ['Versione del gioco',g.gameVersion||'Da verificare'],
   ['Versione della patch',g.patchVersion||'Non pubblicata'],
   ['Stato',status]
 ];
 const factsHtml=displayFacts.map(([label,value],i)=>`<div class="ig-data"><dt>${esc(label)}</dt><dd${i===5?' class="ig-status-value"':''}>${esc(value)}</dd></div>`).join('');
 const coverSrc=dossierCover(g.coverUrl);
 const backupSrc=dossierCover(g.coverFallbackUrl);
 const coverHtml=coverSrc?`<img class="ig-art-cover steam-cover" src="${esc(coverSrc)}" ${backupSrc?`data-backup="${esc(backupSrc)}"`:''} alt="Copertina di ${esc(g.title)}" loading="eager" decoding="async">`:'';
 const statusKey=['in-revisione','da-verificare','in-lavorazione','in-test','disponibile'].includes(g.status)?g.status:'da-verificare';
 const downloadHtml=available?`<div class="ig-release-content"><span class="ig-release-label">PATCH ITALIANA VERIFICATA</span><strong>La traduzione è disponibile</strong><small>Controlla versione e istruzioni prima dell’installazione.</small></div><div class="ig-release-actions"><a class="ig-download-link" href="${esc(g.downloadUrl)}" target="_blank" rel="noopener noreferrer">Scarica la patch ↗</a>${steam?`<a class="ig-steam-link" href="${esc(g.steamUrl)}" target="_blank" rel="noopener noreferrer">Apri su Steam ↗</a>`:''}</div>`:`<div class="ig-release-content"><span class="ig-release-label">STATO DELLA PATCH</span><strong>Download temporaneamente non disponibile</strong><small>${demo?'La scheda è in preparazione.':'La patch verrà pubblicata soltanto dopo i test di compatibilità.'}</small></div>${steam?`<a class="ig-steam-link" href="${esc(g.steamUrl)}" target="_blank" rel="noopener noreferrer">Apri su Steam ↗</a>`:''}`;
 const extraSteps=available?`<section class="ig-extra" aria-labelledby="ig-install-${esc(g.id)}"><span class="ig-section-index">03 / INSTALLAZIONE</span><h2 id="ig-install-${esc(g.id)}">Prima di giocare.</h2><ol class="ig-install-steps">${g.installSteps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></section>`:'';
 const extraShots=shots.length?`<section class="ig-extra" aria-labelledby="ig-screens-${esc(g.id)}"><span class="ig-section-index">${available?'04':'03'} / SCHERMATE</span><h2 id="ig-screens-${esc(g.id)}">Uno sguardo dentro.</h2><div class="ig-screens-grid">${shots.map(shot=>`<img src="../${esc(shot)}" alt="Screenshot della traduzione italiana di ${esc(g.title)}" loading="lazy" decoding="async">`).join('')}</div></section>`:'';
 const html=`<!doctype html>
<html lang="it"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#15231F"><meta name="description" content="${esc(g.title)} su Indietaliano: informazioni sulla traduzione italiana, compatibilità e download quando verificato.">
<meta name="robots" content="noindex,nofollow"><title>${esc(g.title)} · Indietaliano</title>
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../style.css"><link rel="stylesheet" href="../retro-editorial.css"><link rel="stylesheet" href="../typography.css"><link rel="stylesheet" href="../catalog-v3-7.css?v=380"><link rel="stylesheet" href="../verde-bottiglia.css?v=460">
<script defer src="../detail-page.js"></script></head>
<body class="ig-game-view"><a class="skip-link" href="#contenuto">Vai al contenuto</a>
<header class="masthead"><a class="type-logo" href="../index.html">indie<span>taliano</span><i>.</i></a><nav class="mast-nav" aria-label="Navigazione principale"><a href="../index.html#giochi">Giochi</a><a href="../index.html#sostieni">Sostieni</a><a class="nav-admin" href="../gestione.html">Gestione</a></nav><button id="theme-toggle" type="button" class="theme-button" aria-label="Attiva variante chiara"><span aria-hidden="true">◐</span> <span class="theme-word">Tema</span></button></header>
<main id="contenuto" class="ig-container">
<div class="ig-crumb"><a href="../index.html#giochi" class="ig-back">← Torna all’archivio</a><span class="ig-number">INDIETALIANO / ${String(idx+1).padStart(2,'0')} DI ${String(games.length).padStart(2,'0')}</span></div>
<section class="ig-opening" aria-labelledby="ig-title"><div class="ig-eyebrow">Un gioco da scoprire</div><div class="ig-headline"><h1 id="ig-title">${esc(g.title)}<span aria-hidden="true">.</span></h1><span class="ig-status ig-status-${esc(statusKey)}"><i aria-hidden="true"></i> Traduzione ${esc(status).toLowerCase()}</span></div><p class="ig-lead">${esc(g.description||'Scopri questo videogioco indie su Indietaliano.')}</p></section>
<section class="ig-art-block" aria-label="Copertina di ${esc(g.title)}"><span class="ig-art-top">GIOCHI INDIE / PC</span><div class="ig-art-pattern" aria-hidden="true"></div><span class="ig-art-fallback" aria-hidden="true">${symbol[g.accent]||'✳'}</span>${coverHtml}<span class="ig-art-corner">DAL CATALOGO / ${String(idx+1).padStart(3,'0')}</span></section>
<section class="ig-facts" id="scheda" aria-labelledby="ig-facts-title"><div class="ig-section-top"><span class="ig-section-index">01 / DATI ESSENZIALI</span><span class="ig-section-small">INFORMAZIONI DEL GIOCO</span></div><h2 id="ig-facts-title">La scheda, in breve.</h2><dl class="ig-facts-grid">${factsHtml}</dl><div class="ig-facts-note"><span>Ultimo controllo della traduzione</span><span>${esc(g.updated||'Da verificare')}</span></div></section>
<section class="ig-translation" id="traduzione" aria-labelledby="ig-translation-title"><div class="ig-section-top"><span class="ig-section-index">02 / IL PROGETTO</span><span class="ig-section-small">TRADUZIONE AMATORIALE · ITALIANO</span></div><h2 id="ig-translation-title">La traduzione italiana.</h2><p>${esc(notes)}</p><div class="ig-release ig-release-${available?'ready':'pending'}"><span class="ig-release-icon" aria-hidden="true">${available?'✓':'↻'}</span>${downloadHtml}</div></section>
${extraSteps}${extraShots}
<footer class="ig-footer"><p>Indietaliano è un progetto indipendente di traduzioni amatoriali. Le patch non includono il gioco originale.</p><a href="../index.html#giochi">Torna ai giochi ↑</a></footer>
</main></body></html>`;
 fs.writeFileSync(path.join(outDir,`${g.id}.html`),html);
 console.log('Generata scheda:',g.title, available ? '(patch verificata)' : '(in revisione, download bloccato)');
}
