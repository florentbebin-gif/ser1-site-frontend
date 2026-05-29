import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

function readThemePaletteMigration(): string {
  const file = readdirSync(migrationsDir).find((entry) =>
    entry.endsWith('_theme_palette_contract.sql'),
  );
  if (!file) {
    throw new Error('Migration theme_palette_contract introuvable');
  }
  return readFileSync(path.join(migrationsDir, file), 'utf8');
}

describe('migration contrat palettes theme', () => {
  it('pre-check les palettes existantes avant toute contrainte', () => {
    const sql = readThemePaletteMigration();

    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.is_theme_palette/i);
    expect(sql).toMatch(/from\s+public\.themes[\s\S]*not\s+public\.is_theme_palette\(palette\)/i);
    expect(sql).toMatch(
      /from\s+public\.ui_settings[\s\S]*my_palette\s+is\s+not\s+null[\s\S]*not\s+public\.is_theme_palette\(my_palette\)/i,
    );
    expect(sql).toMatch(/raise\s+exception[\s\S]*themes=%[\s\S]*ui_settings=%/i);
  });
});
