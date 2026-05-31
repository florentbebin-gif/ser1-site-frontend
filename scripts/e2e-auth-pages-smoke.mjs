import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const ENV_PATH = resolve(process.cwd(), '.env.local');
const PORT = Number(process.env.SER1_E2E_AUTH_PORT ?? 5173);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const PLACEHOLDER_RE = /placeholder|your-|YOUR-|<mot-de-passe/i;

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/set-password', '/reset-password'];

const AUTH_ROUTES = [
  '/',
  '/audit',
  '/strategy',
  '/sim/placement',
  '/sim/credit',
  '/sim/succession',
  '/sim/per',
  '/sim/per/potentiel',
  '/sim/per/transfert',
  '/sim/epargne-salariale',
  '/sim/tresorerie-societe',
  '/sim/prevoyance',
  '/sim/ir',
  '/settings',
  '/settings/impots',
  '/settings/prelevements',
  '/settings/base-contrat',
  '/settings/base-contrat-retraite',
  '/settings/dmtg-succession',
  '/settings/prevoyance-regimes',
  '/settings/design-system',
  '/settings/comptes',
];

function loadLocalEnv() {
  const content = readFileSync(ENV_PATH, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]+?)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2] ?? '';
    if (!process.env[key]) process.env[key] = value;
  }

  if (!process.env.E2E_EMAIL || PLACEHOLDER_RE.test(process.env.E2E_EMAIL)) {
    process.env.E2E_EMAIL = process.env.SER1_LLM_TEST_EMAIL;
  }
  if (!process.env.E2E_PASSWORD || PLACEHOLDER_RE.test(process.env.E2E_PASSWORD)) {
    process.env.E2E_PASSWORD = process.env.SER1_LLM_TEST_PASSWORD;
  }
  process.env.E2E_AUTH_REQUIRED ||= 'true';
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value || PLACEHOLDER_RE.test(value)) {
    throw new Error(`${name} manquant ou encore en placeholder dans .env.local`);
  }
  return value;
}

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 90_000) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok || response.status === 401 || response.status === 404) return;
    } catch {
      // Serveur pas encore prêt.
    }
    await new Promise((resolveReady) => setTimeout(resolveReady, 1_000));
  }
  throw new Error(`Serveur Vite indisponible après 90s : ${BASE_URL}`);
}

function startDevServer() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(
    npmCommand,
    ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(PORT)],
    {
      cwd: process.cwd(),
      env: { ...process.env, VITE_E2E: 'true' },
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    if (/Local:|ready in/i.test(text)) process.stdout.write(text);
  });
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));
  return child;
}

async function stopDevServer(child) {
  if (!child || child.killed) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
    await new Promise((resolveStop) => setTimeout(resolveStop, 1_000));
    return;
  }
  child.kill();
  await new Promise((resolveStop) => setTimeout(resolveStop, 500));
}

async function assertPageHealthy(page, route) {
  const pageErrors = [];
  const onPageError = (error) => pageErrors.push(error.message);
  const onResponse = (response) => {
    const url = response.url();
    if (url.includes('/api/admin') && !response.ok()) {
      pageErrors.push(`API admin ${response.status()} sur ${route}`);
    }
    if (response.status() >= 500) {
      pageErrors.push(`HTTP ${response.status()} sur ${url}`);
    }
  };

  page.on('pageerror', onPageError);
  page.on('response', onResponse);

  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

  if (new URL(page.url()).pathname === '/login' && route !== '/login') {
    throw new Error(`${route} redirige vers /login`);
  }

  const body = await page.locator('body').innerText({ timeout: 15_000 });
  if (!body.trim()) throw new Error(`${route} a rendu une page vide`);

  const viteOverlayCount = await page.locator('vite-error-overlay').count();
  if (viteOverlayCount > 0) throw new Error(`${route} affiche une erreur Vite`);

  page.off('pageerror', onPageError);
  page.off('response', onResponse);

  if (pageErrors.length > 0) {
    throw new Error(`${route} erreurs détectées : ${pageErrors.join(' | ')}`);
  }

  console.log(`OK ${route}`);
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();
  await page.waitForURL(`${BASE_URL}/`, { timeout: 15_000 });
}

async function main() {
  loadLocalEnv();
  requireEnv('VITE_SUPABASE_URL');
  requireEnv('VITE_SUPABASE_ANON_KEY');
  const email = requireEnv('E2E_EMAIL');
  const password = requireEnv('E2E_PASSWORD');

  const server = startDevServer();
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ locale: 'fr-FR', timezoneId: 'Europe/Paris' });

    for (const route of PUBLIC_ROUTES) {
      await assertPageHealthy(page, route);
    }

    await login(page, email, password);

    for (const route of AUTH_ROUTES) {
      await assertPageHealthy(page, route);
    }
  } finally {
    await browser?.close();
    await stopDevServer(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
