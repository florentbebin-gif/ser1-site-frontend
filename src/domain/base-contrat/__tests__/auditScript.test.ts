import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

describe('script audit Base-Contrat / DMTG Succession', () => {
  it('produit un JSON exploitable et nettoie son runtime temporaire', () => {
    const output = execFileSync(
      process.execPath,
      ['scripts/audit-base-contrat-dmtg.mjs', '--json'],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      },
    );

    const metrics = JSON.parse(output) as {
      library?: {
        rows?: unknown[];
        total?: { blocks?: number; sources?: number };
      };
      runtime?: {
        catalogProducts?: number;
        byFamily?: unknown[];
        byProductAudience?: unknown[];
      };
      consumers?: Array<{ zone?: string; file?: string; line?: number; key?: string }>;
      valueClassification?: Array<{ file?: string; class?: string; detail?: string }>;
      policyEvidence?: Array<{ file?: string; line?: number; text?: string }>;
    };

    expect(Array.isArray(metrics.library?.rows)).toBe(true);
    expect(metrics.library?.total?.blocks).toBeGreaterThan(0);
    expect(metrics.library?.total?.sources).toBeGreaterThan(0);
    expect(metrics.runtime?.catalogProducts).toBeGreaterThan(0);
    expect(Array.isArray(metrics.runtime?.byFamily)).toBe(true);
    expect(metrics.runtime?.byProductAudience?.length).toBeGreaterThan(0);
    expect(Array.isArray(metrics.consumers)).toBe(true);
    expect(metrics.consumers?.some((consumer) => consumer.zone === 'engine')).toBe(false);
    expect(metrics.valueClassification?.length).toBeGreaterThan(0);
    expect(
      metrics.valueClassification?.every(
        (item) =>
          typeof item.file === 'string' &&
          typeof item.class === 'string' &&
          typeof item.detail === 'string',
      ),
    ).toBe(true);
    expect(metrics.policyEvidence?.length).toBeGreaterThan(0);
    expect(
      metrics.policyEvidence?.every(
        (item) =>
          typeof item.file === 'string' &&
          typeof item.line === 'number' &&
          typeof item.text === 'string',
      ),
    ).toBe(true);
    expect(existsSync(join(process.cwd(), '.tmp', 'audit-base-contrat-runtime'))).toBe(false);
  });

  it('génère un livrable de veille hors UI sans conserver le runtime temporaire', () => {
    const outPath = join('.tmp', 'veille-base-contrat-test.md');
    const absoluteOutPath = join(process.cwd(), outPath);
    rmSync(absoluteOutPath, { force: true });

    const output = execFileSync(
      process.execPath,
      ['scripts/audit-base-contrat-dmtg.mjs', '--out-veille', outPath],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      },
    );

    expect(output).toContain('Veille écrite dans');
    expect(existsSync(absoluteOutPath)).toBe(true);
    const markdown = readFileSync(absoluteOutPath, 'utf8');

    expect(markdown).toContain('# Veille Base-Contrat');
    expect(markdown).toContain('base_contrat_overrides.review_status');
    expect(markdown).toContain(
      '| Famille | Produit | Audience | Phase | Bloc | Sources | Statut revue | Prochaine revue |',
    );
    expect(markdown).toContain(
      'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047288653',
    );
    expect(existsSync(join(process.cwd(), '.tmp', 'audit-base-contrat-runtime'))).toBe(false);

    rmSync(absoluteOutPath, { force: true });
  });
});
