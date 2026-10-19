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
  'index.html', 'gestione.html', 'gestione.css', 'style.css',
  'home.css', 'retro-editorial.css', 'typography.css', 'catalog-v3-7.css',
  'script.js', 'detail-page.js', 'games.js', 'site-config.js'
];
const publicFolders = ['assets', 'giochi'];
for (const file of publicFiles) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}
for (const folder of publicFolders) {
  fs.cpSync(path.join(root, folder), path.join(output, folder), { recursive: true });
}
console.log('Netlify: pubblicazione preparata in _site/');
