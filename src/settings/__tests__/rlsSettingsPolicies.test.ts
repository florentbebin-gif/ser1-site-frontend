import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

describe('policies RLS settings Base-Contrat / DMTG', () => {
  it('prouve les lectures et écritures attendues sur les tables auditées', () => {
    const output = execFileSync(
      process.execPath,
      ['scripts/check-settings-rls-policies.mjs', '--json'],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
      },
    );

    const report = JSON.parse(output) as {
      ok?: boolean;
      tables?: Record<
        string,
        {
          rlsEnabled?: boolean;
          expectedRead?: boolean;
          expectedWrites?: boolean;
          evidence?: Array<{ file?: string; line?: number; policy?: string }>;
        }
      >;
    };

    expect(report.ok).toBe(true);
    for (const table of ['tax_settings', 'fiscality_settings', 'base_contrat_overrides']) {
      expect(report.tables?.[table]?.rlsEnabled).toBe(true);
      expect(report.tables?.[table]?.expectedRead).toBe(true);
      expect(report.tables?.[table]?.expectedWrites).toBe(true);
      expect(report.tables?.[table]?.evidence?.length).toBeGreaterThan(0);
    }
  });
});
