/* global document, window */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const pages = {
  ir: '/sim/ir',
  credit: '/sim/credit',
  succession: '/sim/succession',
  placement: '/sim/placement',
  'per-potentiel': '/sim/per/potentiel',
  'per-transfert': '/sim/per/transfert',
  'tresorerie-societe': '/sim/tresorerie-societe',
  prevoyance: '/sim/prevoyance',
};

const viewports = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 900 },
};

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, value = 'true'] = arg.slice(2).split('=');
      return [key, value];
    }),
);

const pageKey = args.get('page');
const label = args.get('label') ?? 'snapshot';
const compare = args.has('compare');
const route = pageKey ? pages[pageKey] : null;

if (!pageKey || !route) {
  const available = Object.keys(pages).join(', ');
  throw new Error(`Page inconnue. Utiliser --page=<${available}>.`);
}

const baseUrl = process.env.SER1_VISUAL_BASE_URL ?? 'http://localhost:4173';
const commit = currentCommit();
const outputDir = path.join(process.cwd(), '.tmp', 'sim-ser1-2026', commit);

mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ locale: 'fr-FR', timezoneId: 'Europe/Paris' });
await context.addInitScript(() => {
  window.__SER1_E2E = true;
});

const captures = [];

try {
  for (const [viewportName, viewport] of Object.entries(viewports)) {
    const page = await context.newPage();
    await page.setViewportSize(viewport);
    await page.goto(new URL(route, baseUrl).toString(), { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const screenshotPath = path.join(outputDir, `${pageKey}-${label}-${viewportName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });

    captures.push({
      viewport: viewportName,
      size: viewport,
      screenshot: path.relative(process.cwd(), screenshotPath).replaceAll(path.sep, '/'),
      metrics: await collectMetrics(page),
    });

    await page.close();
  }
} finally {
  await browser.close();
}

const output = {
  page: pageKey,
  label,
  route,
  baseUrl,
  commit,
  capturedAt: new Date().toISOString(),
  captures,
  comparison: compare ? buildComparison(captures) : null,
};

const jsonPath = path.join(outputDir, `${pageKey}-${label}.json`);
writeFileSync(jsonPath, JSON.stringify(output, null, 2));
console.log(`Snapshot visuel écrit dans ${path.relative(process.cwd(), outputDir)}`);

function currentCommit() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'worktree';
  }
}

async function collectMetrics(page) {
  return page.evaluate(() => {
    const selectors = ['body', '[data-testid]', '.premium-card', '.sim-page', '.sim-modal-overlay'];
    const elements = selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll(selector))
        .slice(0, 80)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);

          return {
            selector,
            tagName: element.tagName.toLowerCase(),
            testId: element.getAttribute('data-testid'),
            className: element.getAttribute('class'),
            text: (element.textContent ?? '').trim().slice(0, 120),
            rect: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
            colors: {
              color: style.color,
              backgroundColor: style.backgroundColor,
              borderColor: style.borderColor,
            },
            fontSize: style.fontSize,
          };
        }),
    );

    return {
      title: document.title,
      url: window.location.pathname,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      elements,
    };
  });
}

function buildComparison(captures) {
  return captures.map((capture) => ({
    viewport: capture.viewport,
    measuredElements: capture.metrics.elements.length,
    screenshot: capture.screenshot,
  }));
}
