// Simple static server for local dev
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const MIME = {
  '.html': 'text/html', '.htm': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.lottie': 'application/json',
  '.webp': 'image/webp',
};
http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
    p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) p = path.join(p.replace('index.html', ''), 'index.htm');
  }
  if (fs.existsSync(p)) {
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(p).pipe(res);
  } else {
    res.writeHead(404); res.end('Not found');
  }
}).listen(3000, () => console.log('[serve] http://127.0.0.1:3000'));
