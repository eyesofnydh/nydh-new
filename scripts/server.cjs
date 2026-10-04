const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg' };
function createServer(directory, options = {}) {
  const root = path.resolve(directory);
  const guestbook = Promise.all([import('../server/guestbook.mjs'), import('../server/file-store.mjs')]).then(([api, storage]) =>
    api.createGuestbookHandler({ store: storage.createFileStore(options.guestbookDirectory || path.resolve(__dirname, '../.local/guestbook')) }));
  return http.createServer(async (request, response) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { response.writeHead(400).end(); return; }
    if (pathname === '/api/guestbook') {
      try {
        const chunks = [];
        let size = 0;
        for await (const chunk of request) {
          size += chunk.length;
          if (size > 16384) { response.writeHead(413).end(); return; }
          chunks.push(chunk);
        }
        const method = request.method;
        const apiResponse = await (await guestbook)(new Request(`http://${request.headers.host}/api/guestbook`, {
          method, headers: request.headers,
          ...(method !== 'GET' && method !== 'HEAD' ? { body: Buffer.concat(chunks) } : {})
        }), { ip: request.socket.remoteAddress });
        response.writeHead(apiResponse.status, Object.fromEntries(apiResponse.headers));
        response.end(await apiResponse.text());
      } catch { response.writeHead(503, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Guestbook temporarily unavailable.' })); }
      return;
    }
    if (pathname.split('/').some(part => part.startsWith('.')) || /^\/(server|scripts|netlify|node_modules|tests)\//.test(pathname)) {
      response.writeHead(404).end(); return;
    }
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
