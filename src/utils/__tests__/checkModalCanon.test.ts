import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/check-modal-canon.mjs');
const tempRoots: string[] = [];

function createRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ser1-modal-canon-'));
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

describe('check-modal-canon', () => {
  it('signale une largeur de modale racine en dur', () => {
    const root = createRoot();
    writeFixture(
      root,
      'src/features/demo/styles/demo.css',
      '.demo-modal {\n  max-width: 760px;\n}\n',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('src/features/demo/styles/demo.css');
    expect(output).toContain('.demo-modal');
  });

  it('autorise width:100% et les sous-éléments de modale', () => {
    const root = createRoot();
    writeFixture(
      root,
      'src/features/demo/styles/demo.css',
      '.demo-modal {\n  width: 100%;\n}\n.demo-modal__body {\n  max-width: 320px;\n}\n',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('Aucune largeur de modale ad hoc');
  });

  it('autorise la source canonique du shell Settings', () => {
    const root = createRoot();
    writeFixture(
      root,
      'src/pages/settings/styles/modals.css',
      '.settings-modal-shell {\n  width: min(720px, 90vw);\n}\n',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('Aucune largeur de modale ad hoc');
  });
});
