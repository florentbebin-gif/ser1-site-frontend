import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/check-no-raw-number-input.mjs');
const tempRoots: string[] = [];

function createRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ser1-raw-number-input-'));
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

describe('check-no-raw-number-input', () => {
  it('signale les inputs number bruts dans les features', () => {
    const root = createRoot();

    writeFixture(
      root,
      'src/features/demo/Demo.tsx',
      'export function Demo() { return <input aria-label="Montant" type="number" />; }',
    );
    writeFixture(
      root,
      'src/pages/settings/DemoSettings.tsx',
      'export function DemoSettings() { return <input type="number" />; }',
    );
    writeFixture(
      root,
      'src/components/settings/SettingsNumber.tsx',
      'export function SettingsNumber() { return <input type="number" />; }',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('src/features/demo/Demo.tsx');
    expect(output).not.toContain('DemoSettings.tsx');
    expect(output).not.toContain('SettingsNumber.tsx');
  });

  it('accepte les saisies numeriques textuelles hors settings', () => {
    const root = createRoot();

    writeFixture(
      root,
      'src/features/demo/Demo.tsx',
      'export function Demo() { return <input type="text" inputMode="numeric" />; }',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('Aucun <input type="number"> brut');
  });
});
