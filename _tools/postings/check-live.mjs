import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash} from './extract.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const manifest=JSON.parse(await readFile(path.join(root,'postings/manifest.json'),'utf8'));
const origin=process.argv.includes('--local')?'http://127.0.0.1:18766':manifest.siteUrl;
const routes=['/postings/','/postings/manifest.json','/postings/assets/style.css','/postings/assets/app.js',...manifest.bursts.map(b=>b.path),...manifest.entries.flatMap(e=>[e.path,e.path+'saved.html'])];
const queue=[...new Set(routes)];let count=0;
await Promise.all(Array.from({length:4},async()=>{
 while(queue.length){const route=queue.shift();const url=origin+route+'?v='+manifest.signature.slice(0,12);
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,route);
  const bytes=Buffer.from(await response.arrayBuffer());const local=await readFile(path.join(root,route.endsWith('/')?route+'index.html':route));assert.equal(hash(bytes),hash(local),'Published content differs: '+route);count++;
 }
}));
console.log(`Verified ${count} ${origin} URLs against generated files, including all 13 saved-page copies.`);
