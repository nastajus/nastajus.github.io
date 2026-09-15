import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
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
server.listen(18766,'127.0.0.1',()=>{
 const url='http://127.0.0.1:18766/postings/';
 console.log('Job Shelf preview: '+url);
 if(process.env.POSTINGS_OPEN_FIREFOX==='1'){
  const browser=spawn('C:/Program Files/Mozilla Firefox/firefox.exe',['-new-tab',url],{detached:true,stdio:'ignore',windowsHide:true});
  browser.on('error',error=>console.error('Firefox could not open:',error.message));
  browser.unref();
 }
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Port 18766 is already in use. Stop the previous Job Shelf preview before launching again.':error.message);process.exitCode=1;});
