import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migrationsDir = new URL('../../../../supabase/migrations/', import.meta.url);

function readPrevoyanceCompositionMigrations(): string {
  return readdirSync(migrationsDir)
    .filter((fileName) => fileName.includes('prevoyance_regime_compositions'))
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
});
