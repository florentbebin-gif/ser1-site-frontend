import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/check-sim-kpi-border.mjs');
const tempRoots: string[] = [];

function createRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ser1-sim-kpi-border-'));
  tempRoots.push(root);
  return root;
}

function writeFixture(root: string, relativePath: string, content: string) {
  const fullPath = join(root, relativePath);
  mkdirSync(join(fullPath, '..'), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
}

function runCheck(root: string) {
  return spawnSync(process.execPath, [scriptPath, '--root', root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('check-sim-kpi-border', () => {
  it('signale les liserés KPI qui ne sont pas en C3', () => {
    const root = createRoot();

    writeFixture(
      root,
      'src/features/demo/styles/summary.css',
      '.demo-summary-card { border-left: 3px solid var(--color-c5); }',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('src/features/demo/styles/summary.css');
    expect(output).toContain('var(--color-c5)');
  });

  it('accepte C3 pour les KPI et ignore les alertes hors synthèse', () => {
    const root = createRoot();

    writeFixture(
      root,
      'src/features/demo/styles/summary.css',
      [
        '.demo-summary-card { border-left: 3px solid var(--color-c3); }',
        '.demo-warning { border-left: 3px solid var(--color-c6); }',
      ].join('\n'),
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('Liserés KPI /sim/* OK');
  });
});
