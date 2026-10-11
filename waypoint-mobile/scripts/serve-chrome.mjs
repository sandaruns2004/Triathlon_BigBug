// Local-only static host and same-origin mobile API proxy. No website changes.
import http from 'node:http';
import https from 'node:https';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const build = process.env.WAYPOINT_WEB_BUILD || 'web';
if (!['web', 'web-connected', 'web-ui-review'].includes(build)) throw Error('Use web, web-connected or web-ui-review build output.');
const root = fileURLToPath(new URL('../build/'+build+'/', import.meta.url));
const target = new URL(process.env.WAYPOINT_API_ORIGIN || 'http://127.0.0.1:3000');
if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password ||
    target.pathname !== '/' || target.search || target.hash) throw Error('Use an HTTP(S) API origin.');
const port = Number(process.env.WAYPOINT_CHROME_PORT || 4183);
const mime = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json',
  '.wasm':'application/wasm', '.png':'image/png', '.svg':'image/svg+xml',
  '.woff2':'font/woff2', '.ttf':'font/ttf', '.css':'text/css'};
http.createServer(async (req, res) => {
  if (!['localhost:'+port, '127.0.0.1:'+port].includes(req.headers.host)) {
    res.writeHead(403); return res.end();
  }
  const url = new URL(req.url, 'http://localhost:'+port);
  if (url.pathname.startsWith('/api/mobile/v1/')) {
    // Only this local UI may send credentials. Never forward browser cookies.
    if (req.headers.origin && req.headers.origin !== 'http://'+req.headers.host) {
      res.writeHead(403); return res.end();
    }
    const headers = {};
    for (const name of ['authorization', 'content-type', 'content-length', 'accept']) {
      if (req.headers[name]) headers[name] = req.headers[name];
    }
    const upstream = (target.protocol === 'https:' ? https : http).request(
      new URL(url.pathname + url.search, target),
      {method:req.method, headers}, response => {
        res.writeHead(response.statusCode, {'Content-Type':response.headers['content-type'] || 'application/json',
          'Cache-Control':'no-store'});
        response.pipe(res);
      });
    upstream.setTimeout(25000, () => upstream.destroy());
    upstream.on('error', () => {
      if (!res.headersSent) res.writeHead(503, {'Content-Type':'application/json'});
      res.end(JSON.stringify({error:{code:'backend_unavailable',message:'Start the configured Waypoint API service and retry.'}}));
    });
    req.pipe(upstream);
    return;
  }
  try {
    const file = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(resolve(root) + sep)) { res.writeHead(403); return res.end(); }
    if (!(await stat(file)).isFile()) throw Error('Not a file');
    res.writeHead(200, {'Content-Type':mime[extname(file)] || 'application/octet-stream',
      'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff'});
    createReadStream(file).pipe(res);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log('Waypoint Chrome: http://localhost:'+port));
