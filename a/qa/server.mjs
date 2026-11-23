import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const localSourceRoot = resolve(import.meta.dirname, '../dist');
const defaultRoot = existsSync(join(localSourceRoot, 'index.html')) ? localSourceRoot : resolve(import.meta.dirname, '..');
const root = resolve(import.meta.dirname, process.env.PORTFOLIO_SITE_ROOT || defaultRoot);
const port = Number(process.env.PORTFOLIO_QA_PORT || 4317);
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png'
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  let file = resolve(root, `.${pathname}`);
  if (!file.startsWith(`${root}${sep}`) && file !== root) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, {
    'Content-Type': mime[extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1');
