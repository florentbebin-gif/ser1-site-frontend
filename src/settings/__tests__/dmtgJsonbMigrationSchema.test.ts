import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

function readMigrations(): string {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => readFileSync(path.join(migrationsDir, file), 'utf8'))
    .join('\n');
}

describe('migration JSONB DMTG', () => {
  it('stabilise les anciens blobs tax_settings vers le format ligneDirecte', () => {
    const sql = readMigrations();

    expect(sql).toMatch(/update\s+public\.tax_settings/i);
    expect(sql).toMatch(/abattementLigneDirecte/i);
    expect(sql).toMatch(/ligneDirecte/i);
    expect(sql).toMatch(/jsonb_set/i);
    expect(sql).toMatch(/-\s*'abattementLigneDirecte'\s*-\s*'scale'/i);
  });
});
