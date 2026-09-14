const toggle=document.getElementById('sidebar-toggle');
function sidebar(closed){document.body.classList.toggle('sidebar-closed',closed);toggle.setAttribute('aria-expanded',String(!closed));try{localStorage.setItem('postings-sidebar',closed?'closed':'open');}catch{}}
let initial=innerWidth<760;try{const stored=localStorage.getItem('postings-sidebar');if(stored)initial=stored==='closed';}catch{}
sidebar(initial);
toggle.addEventListener('click',()=>sidebar(!document.body.classList.contains('sidebar-closed')));
document.addEventListener('keydown',event=>{if(event.ctrlKey&&event.shiftKey&&event.key.toLowerCase()==='s'){event.preventDefault();sidebar(!document.body.classList.contains('sidebar-closed'));}});
let toastTimer;
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-copy]');if(!button)return;
 const url=button.dataset.copy;
 try{await navigator.clipboard.writeText(url);const toast=document.getElementById('toast');toast.textContent='Link copied';toast.classList.add('shown');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('shown'),2200);}
 catch{const dialog=document.getElementById('copy-dialog'),input=document.getElementById('copy-value');input.value=url;dialog.showModal();input.focus();input.select();}
});
const search=document.getElementById('search');
function filter(){if(!search)return;const query=search.value.trim().toLowerCase();let count=0,hidden=0;
 for(const card of document.querySelectorAll('[data-search]')){const match=card.dataset.search.includes(query);card.hidden=!match;if(match){count++;if(card.closest('details.nvm:not([open])'))hidden++;}}
 document.getElementById('search-status').textContent=query?`${count} matching postings${hidden?` · ${hidden} in collapsed NVM groups; expand those groups to view`:''}`:'';
}
search?.addEventListener('input',filter);document.querySelectorAll('details.nvm').forEach(el=>el.addEventListener('toggle',filter));
