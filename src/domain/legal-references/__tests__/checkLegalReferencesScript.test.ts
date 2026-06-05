import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/check-legal-references.mjs');
const tempRoots: string[] = [];

function createRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ser1-legal-references-'));
  tempRoots.push(root);
  return root;
}

function writeFixture(root: string, relativePath: string, content: string) {
  const fullPath = join(root, relativePath);
  mkdirSync(join(fullPath, '..'), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
}

function validReference(overrides: Record<string, unknown> = {}) {
  return {
    id: 'demo-ref',
    label: 'Référence de test',
    sourceType: 'CGI',
    officialUrl: 'https://www.legifrance.gouv.fr/codes/article_lc/DEMO',
    articleOrSection: 'Art. demo',
    scope: 'Fixture de test',
    volatility: 'lawChange',
    relatedSimulatorIds: ['demo'],
    ...overrides,
  };
}

function writeReferences(root: string, references: Array<Record<string, unknown>>) {
  writeFixture(
    root,
    'src/domain/legal-references/references.json',
    JSON.stringify(references, null, 2),
  );
}

function writeDefinitions(root: string, legalRefs: string[], legalRefsStatus = 'complete') {
  writeFixture(
    root,
    'src/domain/simulators/definitions/demo.ts',
    `
export const DEMO_SIMULATORS = [
  {
    id: 'demo',
    legalRefs: ${JSON.stringify(legalRefs)},
    legalRefsStatus: '${legalRefsStatus}',
  },
];
`,
  );
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

describe('check-legal-references', () => {
  it('accepte une fixture valide', () => {
    const root = createRoot();
    writeReferences(root, [validReference()]);
    writeDefinitions(root, ['demo-ref']);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('check:legal-references ✅');
  });

  it('bloque les ids dupliqués', () => {
    const root = createRoot();
    writeReferences(root, [validReference(), validReference({ label: 'Doublon' })]);
    writeDefinitions(root, ['demo-ref']);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('id dupliqué');
  });

  it('bloque les URLs non officielles', () => {
    const root = createRoot();
    writeReferences(root, [validReference({ officialUrl: 'https://example.com/article' })]);
    writeDefinitions(root, ['demo-ref']);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('officialUrl non officielle');
  });

  it('bloque les références inconnues et les libellés libres', () => {
    const root = createRoot();
    writeReferences(root, [validReference()]);
    writeDefinitions(root, ['CGI art. 200 A']);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('référence inconnue ou libellé libre');
  });

  it('bloque un relatedSimulatorIds inconnu', () => {
    const root = createRoot();
    writeReferences(root, [validReference({ relatedSimulatorIds: ['simulateur-inconnu'] })]);
    writeDefinitions(root, ['demo-ref']);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('relatedSimulatorIds inconnu');
  });

  it('bloque les références orphelines', () => {
    const root = createRoot();
    writeReferences(root, [validReference({ id: 'ref-orpheline' })]);
    writeDefinitions(root, ['demo-ref']);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('référence canonique orpheline');
  });

  it('bloque les planned qui portent des références inventées', () => {
    const root = createRoot();
    writeReferences(root, [validReference()]);
    writeDefinitions(root, ['demo-ref'], 'a-renseigner-avant-codage');

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('planned avec références inventées');
  });

  it('bloque une officialUrl vide', () => {
    const root = createRoot();
    writeReferences(root, [validReference({ officialUrl: '' })]);
    writeDefinitions(root, ['demo-ref']);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('champ officialUrl obligatoire');
  });

  it('bloque un protocole non HTTP(S)', () => {
    const root = createRoot();
    writeReferences(root, [validReference({ officialUrl: 'ftp://legifrance.gouv.fr/demo' })]);
    writeDefinitions(root, ['demo-ref']);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('officialUrl non officielle ou non HTTP(S)');
  });

  it('bloque les champs obligatoires vides', () => {
    const root = createRoot();
    writeReferences(root, [
      validReference({ label: '', scope: '', sourceType: '', volatility: '' }),
    ]);
    writeDefinitions(root, ['demo-ref']);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('champ label obligatoire');
    expect(output).toContain('champ scope obligatoire');
    expect(output).toContain('champ sourceType obligatoire');
    expect(output).toContain('champ volatility obligatoire');
  });

  it('bloque une URL Légifrance datée', () => {
    const root = createRoot();
    writeReferences(root, [
      validReference({
        officialUrl:
          'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000000000001/2021-06-01',
      }),
    ]);
    writeDefinitions(root, ['demo-ref']);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('Légifrance datée');
  });

  it('bloque une URL Légifrance non canonique', () => {
    const root = createRoot();
    writeReferences(root, [
      validReference({
        officialUrl: 'https://www.legifrance.gouv.fr/codes/id/LEGIARTI000000000001/',
      }),
    ]);
    writeDefinitions(root, ['demo-ref']);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('Légifrance non canonique');
  });
});
