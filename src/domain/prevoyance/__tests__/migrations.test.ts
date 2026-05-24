import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migrationsDir = new URL('../../../../supabase/migrations/', import.meta.url);
const FORBIDDEN_SOURCE_LABEL = new RegExp(
  `M[eé]${'mento'}|${'Me'}${'mento'}|${'me'}${'mento'}`,
  'i',
);

function readPrevoyanceCompositionMigrations(): string {
  return readdirSync(migrationsDir)
    .filter((fileName) => fileName.includes('prevoyance_regime_compositions'))
    .map((fileName) => readFileSync(new URL(fileName, migrationsDir), 'utf8'))
    .join('\n');
}

function readPrevoyanceMigrations(): string {
  return readdirSync(migrationsDir)
    .filter((fileName) => fileName.includes('prevoyance'))
    .map((fileName) => readFileSync(new URL(fileName, migrationsDir), 'utf8'))
    .join('\n');
}

describe('migrations Prévoyance', () => {
  it('compose les caisses libérales concernées avec le socle CNAVPL', () => {
    const sql = readPrevoyanceCompositionMigrations();

    for (const code of ['carmf', 'carpimko', 'cavec', 'carcdsf-dentiste', 'carcdsf-sagefemme']) {
      expect(sql).toContain(`'${code}'`);
    }
    expect(sql).not.toContain("'carcdsf'");
  });

  it('ne référence plus les anciennes sources commerciales non traçables', () => {
    const sql = readPrevoyanceMigrations();

    expect(sql).not.toMatch(FORBIDDEN_SOURCE_LABEL);
  });

  it('corrige les valeurs 2026 explicites du plan Prévoyance', () => {
    const sql = readPrevoyanceMigrations();

    expect(sql).toContain('"value": 0.45');
    expect(sql).toContain('"value": 65.84');
    expect(sql).toContain('6 362,52 € min / 14 418 € max 2026');
    expect(sql).toContain('8 964 € min / 24 030 € max 2026');
    expect(sql).toContain('24 545,28 € min / 39 611,28 € max 2026');
    expect(sql).toContain('"value": 25.79');
    expect(sql).toContain('"value": 34.38');
    expect(sql).not.toMatch(/Délai 1 an d'invalidité avérée|2025 — moitié|\\(2025\\)/);
  });
});
