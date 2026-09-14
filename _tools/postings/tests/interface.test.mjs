import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import vm from 'node:vm';
test('search, sidebar shortcut and clipboard use public links',async()=>{
 const html=await readFile(new URL('../../../postings/index.html',import.meta.url),'utf8');
 const code=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');
 const {document,Event}=parseHTML(html);let copied='';const storage={};
 const context=vm.createContext({document,innerWidth:1200,localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},navigator:{clipboard:{writeText:async value=>{copied=value;}}},setTimeout:()=>1,clearTimeout(){}});
 vm.runInContext(code,context);
 const button=document.querySelector('[data-copy]');button.dispatchEvent(new Event('click',{bubbles:true}));await Promise.resolve();assert.match(copied,/^https:\/\/nastajus\.github\.io\/postings\//);
 const keyboard=new Event('keydown');Object.assign(keyboard,{ctrlKey:true,shiftKey:true,key:'S'});document.dispatchEvent(keyboard);assert.ok(document.body.classList.contains('sidebar-closed'));
 const search=document.getElementById('search');search.value='Revit';search.dispatchEvent(new Event('input'));assert.equal(document.querySelectorAll('.posting:not([hidden])').length,1);assert.match(document.querySelector('.posting:not([hidden])').textContent,/Revit/);
 search.value='Scientist';search.dispatchEvent(new Event('input'));assert.match(document.getElementById('search-status').textContent,/collapsed NVM/);assert.equal(document.querySelector('details.nvm').hasAttribute('open'),false);
});
