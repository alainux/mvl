/** Lightweight development server for the already-built docs/ directory. */
import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../docs/', import.meta.url)));
const port = Number(process.env['PORT'] ?? 4174);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const name = url.pathname === '/' ? '/index.html' : url.pathname;
  const path = resolve(root, `.${decodeURIComponent(name)}`);

  // A simple local server should never read files outside its document root.
  if (!path.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  const stream = createReadStream(path);
  stream.on('error', () => {
    if (!response.headersSent) response.writeHead(404);
    response.end('Not found');
  });
  stream.on('open', () => {
    const contentType = CONTENT_TYPES[extname(path)] ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    stream.pipe(response);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`MVL development site: http://127.0.0.1:${port}/`);
});
