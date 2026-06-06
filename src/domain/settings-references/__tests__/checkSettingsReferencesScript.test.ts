import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';

import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/check-settings-references.mjs');
const tempRoots: string[] = [];

type CheckReport = {
  coverage: {
    mode: 'partial';
    isExhaustive: boolean;
    expectedClaimsDefined: boolean;
    bindingsByPage: Record<string, number>;
    byPage: Record<
      string,
      {
        expected: number | null;
        declared: number;
        expectedDefined: boolean;
        complete: boolean;
      }
    >;
  };
};

function createRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ser1-settings-references-'));
  tempRoots.push(root);
  return root;
}

function writeFixture(root: string, relativePath: string, content: string) {
  const fullPath = join(root, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
}

function validReference(overrides: Record<string, unknown> = {}) {
  return {
    id: 'demo-ref',
    label: 'Référence de test',
    sourceType: 'CGI',
    officialUrl: 'https://www.legifrance.gouv.fr/codes/article_lc/DEMO',
    scope: 'Fixture de test',
    volatility: 'lawChange',
    relatedSettings: ['impots'],
    ...overrides,
  };
}

function validBinding(overrides: Record<string, unknown> = {}) {
  return {
    pagePath: '/settings/impots',
    sectionKey: 'income-tax',
    sectionLabel: 'Impôt sur le revenu',
    category: 'valeur-fiscale',
    claimKey: 'income-tax-scale-current',
    claimLabel: 'Barème progressif IR courant',
    target: {
      kind: 'settings-default',
      table: 'tax_settings',
      path: 'incomeTax.scaleCurrent',
    },
    refIds: ['demo-ref'],
    relevanceNote:
      'La référence de test rattache explicitement le claim au chemin tax_settings de la fixture.',
    verifiedAt: '2026-01-01',
    volatility: 'lawChange',
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

function writeChain(root: string, bindings: Array<Record<string, unknown>>) {
  writeFixture(
    root,
    'src/domain/settings-references/chain.json',
    JSON.stringify(bindings, null, 2),
  );
}

function writeDefaults(root: string) {
  writeFixture(
    root,
    'src/constants/settingsDefaults.ts',
    `
export const DEFAULT_TAX_SETTINGS = {
  incomeTax: { scaleCurrent: [] },
  dmtg: {},
};
export const DEFAULT_PS_SETTINGS = {
  patrimony: { current: {} },
  retirementThresholds: { current: {} },
};
export const DEFAULT_FISCALITY_SETTINGS = {
  products: [],
  rulesetsByKey: {},
};
export const DEFAULT_PASS_HISTORY = {
  2026: 1,
};
`,
  );
}

function writeCatalog(root: string) {
  writeFixture(
    root,
    'src/domain/base-contrat/catalog.ts',
    `
export const CATALOG_PP_PM_SPLIT_MAP = {
  contrat_capitalisation: { ppId: 'contrat_capitalisation_pp', pmId: 'contrat_capitalisation_pm' },
};
export const CATALOG = [
  { id: 'assurance_vie' },
];
`,
  );
}

function writeBaseContratRules(root: string) {
  writeFixture(
    root,
    'src/domain/base-contrat/rules/library/assurance-epargne.ts',
    `
const CONTRAT_CAPITALISATION = {
  constitution: [],
  sortie: [],
  deces: [
    {
      title: 'Intégration dans la succession',
      bullets: ['Fixture de bloc décès capitalisation.'],
    },
  ],
};

export function getAssuranceEpargneRules(productId: string) {
  switch (productId) {
    case 'contrat_capitalisation_pp':
      return CONTRAT_CAPITALISATION;
    default:
      return undefined;
  }
}
`,
  );
}

function writeValidRoot(root: string, bindings = [validBinding()]) {
  writeReferences(root, [validReference()]);
  writeChain(root, bindings);
  writeDefaults(root);
  writeCatalog(root);
  writeBaseContratRules(root);
}

function runCheck(root: string) {
  return spawnSync(process.execPath, [scriptPath, '--root', root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

function runCheckJson(root: string) {
  return spawnSync(process.execPath, [scriptPath, '--root', root, '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

function parseCheckReport(stdout: string) {
  return JSON.parse(stdout) as CheckReport;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('check-settings-references', () => {
  it('accepte une fixture settings-default valide', () => {
    const root = createRoot();
    writeValidRoot(root);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('check:settings-references ✅');
    expect(output).toContain('registre partiel non exhaustif');
    expect(output).toContain('Complétude déclarée');
    expect(output).not.toContain('surfaces couvertes');
  });

  it('expose la couverture partielle dans le rapport JSON', () => {
    const root = createRoot();
    writeValidRoot(root);

    const result = runCheckJson(root);
    const report = parseCheckReport(result.stdout);

    expect(result.status).toBe(0);
    expect(report.coverage.mode).toBe('partial');
    expect(report.coverage.isExhaustive).toBe(false);
    expect(report.coverage.expectedClaimsDefined).toBe(false);
    expect(report.coverage.bindingsByPage).toEqual({
      '/settings/impots': 1,
    });
    expect(report.coverage.byPage['/settings/impots']).toEqual({
      expected: null,
      declared: 1,
      expectedDefined: false,
      complete: false,
    });
    expect(report.coverage.byPage['/settings/base-contrat']).toEqual({
      expected: null,
      declared: 0,
      expectedDefined: false,
      complete: false,
    });
  });

  it('bloque une référence inconnue', () => {
    const root = createRoot();
    writeValidRoot(root, [validBinding({ refIds: ['ref-inconnue'] })]);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('référence inconnue');
  });

  it('bloque une relevanceNote absente quand refIds est non vide', () => {
    const root = createRoot();
    writeValidRoot(root, [validBinding({ relevanceNote: '' })]);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('relevanceNote spécifique obligatoire');
  });

  it('bloque un refIds vide sans noRefReason spécifique', () => {
    const root = createRoot();
    writeValidRoot(root, [validBinding({ refIds: [], relevanceNote: undefined })]);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('noRefReason spécifique obligatoire');
  });

  it('bloque un chemin settings-default introuvable', () => {
    const root = createRoot();
    writeValidRoot(root, [
      validBinding({
        target: {
          kind: 'settings-default',
          table: 'tax_settings',
          path: 'incomeTax.cheminAbsent',
        },
      }),
    ]);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('chemin settings-default introuvable');
  });

  it('accepte un target Base-Contrat généré par split PP/PM', () => {
    const root = createRoot();
    writeValidRoot(root, [
      validBinding({
        pagePath: '/settings/base-contrat',
        sectionKey: 'assurance-epargne',
        category: 'deces-transmission',
        claimKey: 'capitalisation-succession-active',
        target: {
          kind: 'base-contrat-rule',
          productId: 'contrat_capitalisation_pp',
          audience: 'pp',
          phase: 'deces',
          blockKey: 'integration-dans-la-succession',
        },
        refIds: [],
        relevanceNote: undefined,
        noRefReason:
          'La fixture représente explicitement un claim sans référence canonique positive qualifiée.',
      }),
    ]);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('check:settings-references ✅');
  });

  it('bloque un target Base-Contrat dont le blockKey ne résout aucun bloc', () => {
    const root = createRoot();
    writeValidRoot(root, [
      validBinding({
        pagePath: '/settings/base-contrat',
        sectionKey: 'assurance-epargne',
        category: 'deces-transmission',
        claimKey: 'capitalisation-succession-active',
        target: {
          kind: 'base-contrat-rule',
          productId: 'contrat_capitalisation_pp',
          audience: 'pp',
          phase: 'deces',
          blockKey: 'bloc-inexistant',
        },
        refIds: [],
        relevanceNote: undefined,
        noRefReason:
          'La fixture représente explicitement un claim sans référence canonique positive qualifiée.',
      }),
    ]);

    const result = runCheck(root);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('blockKey Base-Contrat introuvable');
    expect(output).toContain('integration-dans-la-succession');
  });
});
