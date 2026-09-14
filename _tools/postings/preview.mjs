import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:18766');
  if(url.pathname==='/'||url.pathname==='/postings'){res.writeHead(302,{Location:'/postings/'});return res.end();}
  const decoded=decodeURIComponent(url.pathname);
  if(!decoded.startsWith('/postings/')||decoded.includes('..')||decoded.includes('\\')){res.writeHead(404);return res.end('Not found');}
  let target=path.join(root,decoded);if((await stat(target)).isDirectory())target=path.join(target,'index.html');
  const bytes=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(18766,'127.0.0.1',()=>console.log('Postings preview: http://127.0.0.1:18766/postings/'));
