/* Indietaliano: genera contenuti e prepara i file pubblici per Netlify. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
require(path.join(root, 'build-games.js'));
const output = path.join(root, '_site');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const publicFiles = [
  'index.html', 'segnalazioni.html', 'segnalazione-inviata.html', 'gestione.html', 'gestione.css', 'style.css',
  'home.css', 'retro-editorial.css', 'typography.css', 'catalog-v3-7.css', 'verde-bottiglia.css',
  'script.js', 'detail-page.js', 'games.js', 'site-config.js'
];
const publicFolders = ['assets', 'giochi', 'admin'];
for (const file of publicFiles) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}
for (const folder of publicFolders) {
  fs.cpSync(path.join(root, folder), path.join(output, folder), { recursive: true });
}
// Evita di mostrare un catalogo vecchio dopo un aggiornamento dal CMS.
fs.writeFileSync(path.join(output, '_headers'), '/games.js\n  Cache-Control: no-cache, must-revalidate\n/site-config.js\n  Cache-Control: no-cache, must-revalidate\n');
console.log('Netlify: pubblicazione preparata in _site/');
