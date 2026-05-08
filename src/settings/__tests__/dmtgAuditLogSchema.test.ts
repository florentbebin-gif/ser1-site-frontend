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

function hasUpdatedByColumn(sql: string, table: 'tax_settings' | 'fiscality_settings'): boolean {
  const columnPattern = new RegExp(
    String.raw`alter\s+table\s+public\.${table}[\s\S]*add\s+column\s+if\s+not\s+exists\s+updated_by\s+uuid`,
    'i',
  );
  return columnPattern.test(sql);
}

function hasUpdatedByForeignKey(sql: string, table: 'tax_settings' | 'fiscality_settings'): boolean {
  const fkPattern = new RegExp(
    String.raw`alter\s+table\s+public\.${table}[\s\S]*foreign\s+key\s*\(\s*updated_by\s*\)\s+references\s+auth\.users\s*\(\s*id\s*\)`,
    'i',
  );
  return fkPattern.test(sql);
}

describe('audit log DMTG settings', () => {
  it('conserve updated_at et ajoute updated_by vers auth.users sur les tables DMTG', () => {
    const sql = readMigrations();

    expect(sql).toMatch(/create\s+table\s+"public"\."tax_settings"[\s\S]*"updated_at"\s+timestamp\s+with\s+time\s+zone/i);
    expect(sql).toMatch(/create\s+table\s+"public"\."fiscality_settings"[\s\S]*"updated_at"\s+timestamp\s+with\s+time\s+zone/i);

    for (const table of ['tax_settings', 'fiscality_settings'] as const) {
      expect(hasUpdatedByColumn(sql, table)).toBe(true);
      expect(hasUpdatedByForeignKey(sql, table)).toBe(true);
    }
  });
});
