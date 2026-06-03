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

  it('signale le style visuel local d’une nav de modale', () => {
    const root = createRoot();
    writeFixture(
      root,
      'src/features/demo/styles/demo.css',
      '.demo-modal__nav {\n  padding: 8px;\n  border: 1px solid var(--color-c8);\n}\n',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('style visuel local de nav modale');
    expect(output).toContain('.demo-modal__nav');
  });

  it('autorise le layout pur d’une nav de modale', () => {
    const root = createRoot();
    writeFixture(
      root,
      'src/features/demo/styles/demo.css',
      '.demo-modal__nav {\n  min-width: 0;\n}\n.demo-modal-layout {\n  --sim-modal-nav-width: 190px;\n}\n',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('Aucune largeur de modale ad hoc');
  });

  it('signale les sélecteurs larges de champs Base CG', () => {
    const root = createRoot();
    writeFixture(
      root,
      'src/pages/settings/styles/base-cg-retraite.css',
      '.base-cg-modal input,\n.base-cg-modal select {\n  min-height: 36px;\n}\n',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('sélecteur large de champs Base CG');
    expect(output).toContain('.base-cg-modal input');
  });

  it('signale les fonds locaux sur les primitives input', () => {
    const root = createRoot();
    writeFixture(
      root,
      'src/features/demo/styles/demo.css',
      '.demo-card .sim-field__control {\n  background: var(--surface-card);\n}\n',
    );

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('fond local de primitive input');
    expect(output).toContain('.demo-card .sim-field__control');
  });
});
