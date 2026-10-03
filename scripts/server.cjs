const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg' };
function createServer(directory) {
  const root = path.resolve(directory);
  return http.createServer((request, response) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { response.writeHead(400).end(); return; }
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, bytes) => {
      if (error) { response.writeHead(404).end('Not found'); return; }
      response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      response.setHeader('Cache-Control', 'no-cache');
      response.end(bytes);
    });
  });
}
module.exports = { createServer };
if (require.main === module) {
  const root = path.resolve(__dirname, '..', process.argv.includes('--dist') ? 'dist' : '.');
  const port = Number(process.env.PORT) || 4173;
  createServer(root).listen(port, '127.0.0.1', () => console.log(`Site preview: http://127.0.0.1:${port}`));
}
