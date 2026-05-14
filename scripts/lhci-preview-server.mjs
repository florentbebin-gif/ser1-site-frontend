import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');
const distRoot = resolve(root, 'dist');
const host = '127.0.0.1';
const port = Number(process.env.LHCI_PORT || 4173);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function resolveAssetPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0] || '/');
  const relativePath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
  const candidate = resolve(distRoot, normalize(relativePath));
  if (!candidate.startsWith(distRoot)) return join(distRoot, 'index.html');
  if (!existsSync(candidate)) return join(distRoot, 'index.html');
  if (statSync(candidate).isDirectory()) return join(candidate, 'index.html');
  return candidate;
}

const server = createServer((request, response) => {
  const filePath = resolveAssetPath(request.url || '/');
  const ext = extname(filePath);
  response.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
  createReadStream(filePath)
    .on('error', () => {
      response.statusCode = 500;
      response.end('Erreur serveur LHCI');
    })
    .pipe(response);
});

server.listen(port, host, () => {
  console.log(`LHCI_READY http://${host}:${port}`);
});
