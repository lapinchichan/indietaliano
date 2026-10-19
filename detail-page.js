(() => {
  'use strict';
  const toggle=document.getElementById('theme-toggle');const key='indietaliano-theme';
  try{if(localStorage.getItem(key)==='dark')document.documentElement.classList.add('dark');}catch{}
  const sync=()=>toggle?.setAttribute('aria-label',document.documentElement.classList.contains('dark')?'Attiva tema chiaro':'Attiva tema scuro');
  toggle?.addEventListener('click',()=>{const dark=document.documentElement.classList.toggle('dark');try{localStorage.setItem(key,dark?'dark':'light');}catch{}sync();});sync();
  const year=document.getElementById('year');if(year)year.textContent=String(new Date().getFullYear());
})();

// If Steam's image is blocked, the decorative fallback remains visible.
document.querySelectorAll('img.steam-cover').forEach(img=>{
 img.addEventListener('error',()=>{img.style.display='none';});
});
