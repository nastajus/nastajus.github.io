import assert from 'node:assert/strict';
import {readFile,stat,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseHTML} from 'linkedom';
const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
async function files(dir){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())result.push(...await files(p));else result.push(p);}return result;}
export async function verify(){
 const output=path.join(repoRoot,'postings'),manifest=JSON.parse(await readFile(path.join(output,'manifest.json'),'utf8'));
 assert.ok(manifest.entries.length>0);
 assert.equal(new Set(manifest.entries.map(e=>e.path)).size,manifest.entries.length,'Duplicate posting URLs');
 let checked=0;
 for(const file of await files(output)){
  if(!file.endsWith('.html'))continue;
  const html=await readFile(file,'utf8'),{document}=parseHTML(html);
  assert.doesNotMatch(html,/chatgpt\.com\/c\/|file:\/\/\/C:|_wpnonce=|wordpress_logged_in_/i,'Private browser metadata in '+file);
  assert.equal(document.querySelectorAll('form input[type="password"],script:not([src="/postings/assets/app.js"])').length,0,'Unexpected active content');
  if(path.basename(file)==='saved.html'){
   assert.equal(document.querySelectorAll('header,nav,form,iframe,input,[onerror],[onclick]').length,0);
   assert.ok(document.querySelector('meta[http-equiv="Content-Security-Policy"]'));
  }else{
   for(const element of document.querySelectorAll('[href],[src]')){
    const value=element.getAttribute('href')||element.getAttribute('src');
    if(!value||/^(https?:|mailto:|tel:|#|data:)/.test(value))continue;
    const url=new URL(value,'https://nastajus.github.io/'+path.relative(repoRoot,file).split(path.sep).join('/'));
    if(!url.pathname.startsWith('/postings/'))continue;
    let target=path.join(repoRoot,decodeURIComponent(url.pathname));if(url.pathname.endsWith('/'))target=path.join(target,'index.html');await stat(target);
   }
  }
  checked++;
 }
 const root=parseHTML(await readFile(path.join(output,'index.html'),'utf8')).document;
 assert.equal(root.querySelectorAll('.posting').length,manifest.entries.length);
 for(const group of root.querySelectorAll('details.nvm'))assert.equal(group.hasAttribute('open'),false);
 for(const e of manifest.entries){assert.ok(Number.isFinite(Date.parse(e.savedAt)));assert.match(e.path,/^\/postings\/\d{4}\/[a-z0-9-]+\/(?:[a-z0-9-]+\/)*$/);}
 console.log(`Verified ${checked} HTML pages, ${manifest.entries.length} posting URLs, saved timestamps, local links and collapsed NVM groups.`);
 return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await verify();
