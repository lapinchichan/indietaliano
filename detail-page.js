(() => {
  'use strict';
  const toggle=document.getElementById('theme-toggle'); const key='indietaliano-color-mode';
  document.documentElement.classList.remove('dark');
  try{if(localStorage.getItem(key)==='light')document.documentElement.classList.add('light');}catch{}
  const sync=()=>toggle?.setAttribute('aria-label',document.documentElement.classList.contains('light')?'Attiva la palette verde bottiglia':'Attiva la variante chiara');
  toggle?.addEventListener('click',()=>{const light=document.documentElement.classList.toggle('light');try{localStorage.setItem(key,light?'light':'dark');}catch{}sync();});sync();
  const year=document.getElementById('year');if(year)year.textContent=String(new Date().getFullYear());
})();

// If Steam's image is blocked, the decorative fallback remains visible.
document.querySelectorAll('img.steam-cover').forEach(img=>{
 img.addEventListener('error',()=>{
  const backup=img.dataset.backup;
  if(backup && !img.dataset.backupTried){img.dataset.backupTried='true';img.src=backup;}
  else img.style.display='none';
 });
});
