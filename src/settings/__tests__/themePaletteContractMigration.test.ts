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

  it('ajoute les contraintes themes et ui_settings apres le pre-check', () => {
    const sql = readThemePaletteMigration();
    const precheckIndex = sql.indexOf('invalid_themes_count');
    const themeConstraintIndex = sql.indexOf('themes_palette_contract_check');
    const uiConstraintIndex = sql.indexOf('ui_settings_my_palette_contract_check');

    expect(themeConstraintIndex).toBeGreaterThan(precheckIndex);
    expect(uiConstraintIndex).toBeGreaterThan(precheckIndex);
    expect(sql).toMatch(
      /alter\s+table\s+public\.themes[\s\S]*add\s+constraint\s+themes_palette_contract_check[\s\S]*check\s*\(\s*public\.is_theme_palette\(palette\)\s*\)/i,
    );
    expect(sql).toMatch(
      /alter\s+table\s+public\.ui_settings[\s\S]*add\s+constraint\s+ui_settings_my_palette_contract_check[\s\S]*my_palette\s+is\s+null[\s\S]*public\.is_theme_palette\(my_palette\)/i,
    );
  });
});
