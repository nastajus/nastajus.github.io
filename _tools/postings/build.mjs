import {readFile,writeFile,mkdir,readdir,stat,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {extract,slug,hash,esc} from './extract.mjs';
import {rootPage,burstPage,detailPage,yearPage} from './render.mjs';
export const toolRoot=path.dirname(fileURLToPath(import.meta.url));
export const repoRoot=path.resolve(toolRoot,'../..');
const output=path.join(repoRoot,'postings');
async function walk(dir,prefix=''){
 const found=[];for(const entry of await readdir(dir,{withFileTypes:true})){
  const relative=path.posix.join(prefix,entry.name),absolute=path.join(dir,entry.name);
  if(entry.isSymbolicLink())throw Error(`Symlink inputs are not supported: ${relative}`);
  if(entry.isDirectory())found.push(...await walk(absolute,relative));else if(entry.isFile())found.push({relative,absolute});
 }return found.sort((a,b)=>a.relative.localeCompare(b.relative));
}
async function writeRoute(route,content){
 if(!route.startsWith('/postings/')||route.includes('..'))throw Error('Output escapes postings');
 const target=path.join(repoRoot,route.endsWith('/')?route+'index.html':route);
 if(!target.startsWith(output+path.sep))throw Error('Invalid output destination');
 await mkdir(path.dirname(target),{recursive:true});await writeFile(target,content);
}
function groupFor(folder,burst){
 if(folder==='.')return {groupPath:'',groupLabel:'',hidden:false};
 const segments=folder.split('/');let hidden=false;const names=[],paths=[];
 for(let i=0;i<segments.length;i++){
  const prefix=segments.slice(0,i+1).join('/'),setting=burst.groups?.[prefix];
  const piece=setting?.slug||slug(segments[i]);if(!/^[a-z0-9-]+$/.test(piece))throw Error('Group slug must be URL-safe');
  paths.push(piece);names.push(setting?.label||segments[i]);hidden ||= setting?.hidden===true;
 }return {groupPath:paths.join('/'),groupLabel:names.join(' / '),hidden};
}
export async function build(){
 const config=JSON.parse(await readFile(path.join(toolRoot,'config.json'),'utf8'));
 if(config.basePath!=='/postings/'||config.siteUrl!=='https://nastajus.github.io')throw Error('Unexpected publication target');
 let previous={entries:[],attachments:[]};try{previous=JSON.parse(await readFile(path.join(output,'manifest.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const previousEntries=new Map(previous.entries.map(e=>[e.key,e]));
 const registry=new Map((previous.registry||previous.entries).map(e=>[e.key,e]));
 const sourceMap=[],skipped=[],drafts=new Map(),attachments=[],bursts=[];
 for(const configured of config.bursts){
  if(!/^\d{4}$/.test(String(configured.year))||!/^[a-z0-9-]+$/.test(configured.slug)||!/^\d{4}-\d{2}-\d{2}$/.test(configured.searchedOn))throw Error('Invalid burst year, slug or search date');
  const burst={...configured,key:`${configured.year}/${configured.slug}`,path:`/postings/${configured.year}/${configured.slug}/`};
  if(bursts.some(b=>b.key===burst.key))throw Error('Duplicate burst URL');
  bursts.push(burst);
  const source=path.resolve(repoRoot,burst.source);
  if(source===output||source.startsWith(output+path.sep))throw Error('Source cannot be inside generated output');
  const files=await walk(source); // Missing source is an error, never a deletion signal.
  for(const file of files){
   const ext=path.extname(file.relative).toLowerCase();
   if(!['.html','.htm','.png','.jpg','.jpeg','.webp'].includes(ext)){skipped.push({burst:burst.key,file:file.relative,reason:'Not a saved HTML posting or image'});continue;}
   const stats=await stat(file.absolute),bytes=await readFile(file.absolute),group=groupFor(path.posix.dirname(file.relative),burst);
   if(ext!=='.html'&&ext!=='.htm'){
    const title=/Java Backend Developer/.test(file.relative)?'Java role-title comparison':path.basename(file.relative,ext).replace(/Screenshot.*$/i,'').trim()||'Reference image';
    const fileSlug=slug(title)+'-'+hash(bytes).slice(0,8)+ext;
    const route=burst.path+(group.groupPath?group.groupPath+'/':'')+'references/'+fileSlug;
    attachments.push({burst:burst.key,...group,path:route,title,savedAt:stats.mtime.toISOString(),fileCreatedAt:stats.birthtime.toISOString(),sourceHash:hash(bytes),absolute:file.absolute});
    sourceMap.push({source:file.absolute,url:config.siteUrl+route});continue;
   }
   let parsed;try{parsed=extract(bytes.toString('utf8'),stats);}catch(e){throw Error(`${file.relative}: ${e.message}`);}
   const key=burst.key+':'+parsed.jobNumber;
   const draft={...parsed,...group,key,burst:burst.key,sourceHash:hash(bytes),absolute:file.absolute};
   const prior=drafts.get(key);
   if(!prior||draft.savedAt>prior.savedAt)drafts.set(key,draft);
   sourceMap.push({source:file.absolute,key});
  }
 }
 const entries=[],pages=[];
 const reserved=new Map([...registry.values()].map(e=>[e.path,e.key]));
 for(const draft of [...drafts.values()].sort((a,b)=>a.key.localeCompare(b.key))){
  const burst=bursts.find(b=>b.key===draft.burst),prior=registry.get(draft.key);
  let name=prior?.slug||slug(draft.title);
  const prefix=burst.path+(draft.groupPath?draft.groupPath+'/':'');
  let route=prefix+name+'/';
  if(reserved.has(route)&&reserved.get(route)!==draft.key){name+='-'+hash(draft.key).slice(0,8);route=prefix+name+'/';}
  reserved.set(route,draft.key);
  const {content,snapshot,absolute,...metadata}=draft;
  const aliases=[...new Set([...(prior?.aliases||[]),...(prior?.path&&prior.path!==route?[prior.path]:[])])].filter(p=>p!==route);
  const entry={...metadata,slug:name,path:route,aliases};entries.push(entry);pages.push({entry,content,snapshot});registry.set(entry.key,entry);
 }
 bursts.sort((a,b)=>b.searchedOn.localeCompare(a.searchedOn)||b.key.localeCompare(a.key));
 const publicBursts=bursts.map(({source,groups,...b})=>b);
 const publicAttachments=attachments.map(({absolute,...a})=>a);
 const state={version:1,siteUrl:config.siteUrl,timeZone:config.timeZone,bursts:publicBursts,entries,attachments:publicAttachments,registry:[...registry.values()]};
 const signature=hash(JSON.stringify(state));
 state.builtAt=previous.signature===signature?previous.builtAt:new Date().toISOString();state.signature=signature;
 // Parse and validate every input before writing anything to the public tree.
 await mkdir(path.join(output,'assets'),{recursive:true});
 for(const name of ['style.css','app.js'])await copyFile(path.join(toolRoot,'assets',name),path.join(output,'assets',name));
 for(const {entry,content,snapshot} of pages){
  await writeRoute(entry.path,detailPage(state,entry,content));
  await writeRoute(entry.path+'saved.html',snapshot);
  for(const alias of entry.aliases)await writeRoute(alias,`<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${esc(entry.path)}"><link rel="canonical" href="${config.siteUrl+entry.path}"><title>Posting moved</title><a href="${entry.path}">Open ${esc(entry.title)}</a>`);
 }
 for(const a of attachments){const destination=path.join(repoRoot,a.path);await mkdir(path.dirname(destination),{recursive:true});await copyFile(a.absolute,destination);}
 await writeRoute('/postings/',rootPage(state));
 for(const burst of publicBursts){
  await writeRoute(burst.path,burstPage(state,burst));
  const groups=new Set(entries.filter(e=>e.burst===burst.key&&e.groupPath).map(e=>e.groupPath));
  for(const group of groups)await writeRoute(burst.path+group+'/',burstPage(state,burst,group));
 }
 for(const year of new Set(publicBursts.map(b=>b.year)))await writeRoute(`/postings/${year}/`,yearPage(state,year));
 await writeRoute('/postings/manifest.json',JSON.stringify(state,null,2)+'\n');
 await mkdir(path.join(toolRoot,'.local'),{recursive:true});
 await writeFile(path.join(toolRoot,'.local/source-map.json'),JSON.stringify({builtAt:state.builtAt,sources:sourceMap.map(s=>s.url?s:{...s,url:state.siteUrl+entries.find(e=>e.key===s.key).path}),skipped},null,2));
 console.log(`Built ${entries.length} postings (${entries.filter(e=>e.hidden).length} hidden by default), ${attachments.length} reference image(s), ${bursts.length} burst(s). Skipped ${skipped.length} browser shortcuts/other files.`);
 return state;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();
