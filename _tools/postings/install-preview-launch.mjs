import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const tools=path.dirname(fileURLToPath(import.meta.url));
const career=path.resolve(tools,'../../../..');
const target=path.join(career,'.vscode/launch.json');
const relative=path.relative(career,tools).split(path.sep).join('/');
const configuration={name:'Job Shelf',type:'node',request:'launch',program:`${'${workspaceFolder}'}/${relative}/preview.mjs`,cwd:`${'${workspaceFolder}'}/${relative}`,env:{POSTINGS_OPEN_FIREFOX:'1'},console:'integratedTerminal',skipFiles:['<node_internals>/**']};
let launch={version:'0.2.0',configurations:[]};
try{launch=JSON.parse(await readFile(target,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
if(!Array.isArray(launch.configurations))throw Error('Expected launch configurations array');
const index=launch.configurations.findIndex(c=>c.name===configuration.name||c.program===configuration.program);
if(index<0)launch.configurations.push(configuration);else launch.configurations[index]=configuration;
await mkdir(path.dirname(target),{recursive:true});
await writeFile(target,JSON.stringify(launch,null,2)+'\n');
console.log('Installed Job Shelf in '+target);
