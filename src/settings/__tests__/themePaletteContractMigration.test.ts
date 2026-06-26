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

function readThemePaletteNullFixMigration(): string {
  const file = readdirSync(migrationsDir).find((entry) =>
    entry.endsWith('_fix_theme_palette_contract_null.sql'),
  );
  if (!file) {
    throw new Error('Migration fix_theme_palette_contract_null introuvable');
  }
  return readFileSync(path.join(migrationsDir, file), 'utf8');
}

function readThemePaletteSearchPathFixMigration(): string {
  const file = readdirSync(migrationsDir).find((entry) =>
    entry.endsWith('_fix_is_theme_palette_search_path.sql'),
  );
  if (!file) {
    throw new Error('Migration fix_is_theme_palette_search_path introuvable');
  }
  return readFileSync(path.join(migrationsDir, file), 'utf8');
}

describe('migration contrat palettes theme', () => {
  it('pre-check les palettes existantes avant toute contrainte', () => {
    const sql = readThemePaletteMigration();

    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.is_theme_palette/i);
    expect(sql).toMatch(/from\s+public\.themes/i);
    expect(sql).toMatch(/my_palette\s+as\s+palette[\s\S]*from\s+public\.ui_settings/i);
    expect(sql).toMatch(/raise\s+exception[\s\S]*themes=%[\s\S]*ui_settings=%/i);
  });

  it('liste les lignes invalides avec table id champ et raison', () => {
    const sql = readThemePaletteMigration();

    expect(sql).toMatch(
      /jsonb_build_object\([\s\S]*'table'[\s\S]*'id'[\s\S]*'champ'[\s\S]*'raison'/i,
    );
    expect(sql).toMatch(/lignes invalides=%/i);
    expect(sql).toMatch(/cle manquante/i);
    expect(sql).toMatch(/cle extra/i);
    expect(sql).toMatch(/hex invalide/i);
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

  it('durcit is_theme_palette pour ne jamais laisser passer null dans un check', () => {
    const sql = readThemePaletteNullFixMigration();

    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.is_theme_palette/i);
    expect(sql).toMatch(
      /case[\s\S]*jsonb_typeof\(value\)\s+is\s+distinct\s+from\s+'object'[\s\S]*then\s+false/i,
    );
    expect(sql).toMatch(/coalesce\([\s\S]*array_agg\(key\s+order\s+by\s+key\)/i);
    expect(sql).toMatch(/coalesce\([\s\S]*bool_and\(/i);
  });

  it('ajoute des assertions SQL pour les palettes invalides et valides', () => {
    const sql = readThemePaletteNullFixMigration();

    expect(sql).toMatch(/public\.is_theme_palette\('\{\}'::jsonb\)\s+is\s+not\s+false/i);
    expect(sql).toMatch(/public\.is_theme_palette\(null::jsonb\)\s+is\s+not\s+false/i);
    expect(sql).toMatch(/valid_palette\s+-\s+'c10'/i);
    expect(sql).toMatch(/jsonb_build_object\('c11',\s*'#[0-9A-Fa-f]{6}'\)/i);
    expect(sql).toMatch(/"#12345G"/i);
    expect(sql).toMatch(/public\.is_theme_palette\(valid_palette\)\s+is\s+not\s+true/i);
  });

  it('remplace les contraintes par une verification is true', () => {
    const sql = readThemePaletteNullFixMigration();

    expect(sql).toMatch(/drop\s+constraint\s+if\s+exists\s+themes_palette_contract_check/i);
    expect(sql).toMatch(/drop\s+constraint\s+if\s+exists\s+ui_settings_my_palette_contract_check/i);
    expect(sql).toMatch(
      /add\s+constraint\s+themes_palette_contract_check[\s\S]*check\s*\(\s*public\.is_theme_palette\(palette\)\s+is\s+true\s*\)/i,
    );
    expect(sql).toMatch(
      /add\s+constraint\s+ui_settings_my_palette_contract_check[\s\S]*check\s*\(\s*my_palette\s+is\s+null\s+or\s+public\.is_theme_palette\(my_palette\)\s+is\s+true\s*\)/i,
    );
  });
});

describe('migration search_path is_theme_palette', () => {
  it('fige le search_path de is_theme_palette sans changer son contrat', () => {
    const sql = readThemePaletteSearchPathFixMigration();

    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.is_theme_palette/i);
    expect(sql).toMatch(/\bimmutable\b/i);
    expect(sql).toMatch(/set\s+search_path\s*=\s*''/i);
    // Corps null-safe conservé : aucune régression de contrat.
    expect(sql).toMatch(
      /case[\s\S]*jsonb_typeof\(value\)\s+is\s+distinct\s+from\s+'object'[\s\S]*then\s+false/i,
    );
    expect(sql).toMatch(/coalesce\([\s\S]*array_agg\(key\s+order\s+by\s+key\)/i);
    expect(sql).toMatch(/coalesce\([\s\S]*bool_and\(/i);
  });
});
