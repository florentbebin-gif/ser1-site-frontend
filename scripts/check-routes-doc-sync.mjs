#!/usr/bin/env node
// Usage: npm run check:routes-doc-sync

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const APP_ROUTES_FILE = path.join(ROOT, 'src', 'routes', 'appRoutes.ts');
const SETTINGS_ROUTES_FILE = path.join(ROOT, 'src', 'routes', 'settingsRoutes.ts');
const ARCHITECTURE_FILE = path.join(ROOT, 'docs', 'ARCHITECTURE.md');

function collectPaths(file) {
  const source = fs.readFileSync(file, 'utf8');
  return [...source.matchAll(/\bpath:\s*'([^']+)'/g)].map((match) => match[1]);
}

const architecture = fs.readFileSync(ARCHITECTURE_FILE, 'utf8');
const appRoutes = collectPaths(APP_ROUTES_FILE).filter((route) => route !== '*');
const settingsRoutes = collectPaths(SETTINGS_ROUTES_FILE).map((route) =>
  route ? `/settings/${route}` : '/settings',
);

const missing = [...appRoutes, ...settingsRoutes].filter((route) => !architecture.includes(route));

if (missing.length > 0) {
  console.error('check:routes-doc-sync ❌');
  for (const route of missing) {
    console.error(`- ${route}: absent de docs/ARCHITECTURE.md`);
  }
  process.exit(1);
}

console.log('check:routes-doc-sync ✅');
