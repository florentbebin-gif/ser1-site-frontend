import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/check-svg-icons.mjs');
const tempRoots: string[] = [];

function createRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ser1-svg-icons-'));
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

describe('check-svg-icons', () => {
  it('signale les petites icones SVG inline dans les features', () => {
    const root = createRoot();

    writeFixture(
      root,
      'src/features/demo/Demo.tsx',
      'export function Demo() { return <svg viewBox="0 0 24 24"><path d="M1 1h2" /></svg>; }',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('src/features/demo/Demo.tsx');
  });

  it('accepte les SVG metier nommes', () => {
    const root = createRoot();

    writeFixture(
      root,
      'src/features/demo/DemoDonut.tsx',
      [
        'export function DemoDonut() {',
        '  return <svg className="demo-donut" viewBox="0 0 72 72">',
        '    <circle cx="36" cy="36" r="28" />',
        '  </svg>;',
        '}',
      ].join('\n'),
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('Aucun petit SVG inline');
  });
});
