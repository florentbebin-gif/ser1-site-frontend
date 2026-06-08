import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';

import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/check-sim-cards.mjs');
const tempRoots: string[] = [];
const simFeatures = [
  'credit',
  'ir',
  'succession',
  'prevoyance',
  'tresorerie-societe',
  'per',
  'placement',
];

function createRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ser1-sim-cards-'));
  tempRoots.push(root);

  for (const feature of simFeatures) {
    mkdirSync(join(root, 'src', 'features', feature), { recursive: true });
  }
  mkdirSync(join(root, 'src', 'pages'), { recursive: true });
  mkdirSync(join(root, 'src', 'components'), { recursive: true });
  mkdirSync(join(root, 'src', 'styles', 'sim'), { recursive: true });

  return root;
}

function writeFixture(root: string, relativePath: string, content: string) {
  const fullPath = join(root, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
}

function runCheck(root: string) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    encoding: 'utf8',
  });
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('check-sim-cards', () => {
  it('signale un override local qui élève une surface plate', () => {
    const root = createRoot();
    writeFixture(root, 'src/styles/sim/surfaces.css', '.sim-band {\n  padding: 1rem;\n}\n');
    writeFixture(
      root,
      'src/features/credit/override.css',
      '.credit-surface .sim-band {\n  box-shadow: var(--shadow-sm);\n}\n',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('src/features/credit/override.css');
    expect(output).toContain('.credit-surface .sim-band');
    expect(output).toContain('porte box-shadow');
  });

  it('autorise box-shadow none sur les surfaces plates', () => {
    const root = createRoot();
    writeFixture(root, 'src/styles/sim/surfaces.css', '.sim-band {\n  box-shadow: none;\n}\n');

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('Contrat cards /sim/* OK');
  });
});
