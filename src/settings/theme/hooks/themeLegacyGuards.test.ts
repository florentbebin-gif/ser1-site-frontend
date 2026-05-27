import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SOURCE_RANKS } from './useThemeSync';

const blockedColumns = [
  ['selected', 'theme', 'ref'].join('_'),
  ['custom', 'palette'].join('_'),
  ['active', 'palette'].join('_'),
  ['theme', 'colors'].join('_'),
  ['theme', 'name'].join('_'),
  ['cover', 'slide', 'url'].join('_'),
];

function readSource(file: string): string {
  return readFileSync(new URL(file, import.meta.url), 'utf8');
}

describe('theme V5 data contract', () => {
  it('ne lit plus les anciennes colonnes thème dans la session', () => {
    const source = readSource('./useThemeSession.ts');

    for (const column of blockedColumns) {
      expect(source).not.toContain(column);
    }
    expect(source).not.toContain(['user', 'metadata'].join('_'));
    expect(source).toContain('theme_mode, preset_id, my_palette, theme_scope');
  });

  it('ne réécrit plus les anciennes colonnes thème dans les actions', () => {
    const source = readSource('./useThemeActions.ts');

    for (const column of blockedColumns) {
      expect(source).not.toContain(column);
    }
    expect(source).toContain('theme_mode: mode');
    expect(source).toContain('my_palette: colors');
  });

  it('ne garde pas de rang de priorité pour les anciennes sources runtime', () => {
    expect(SOURCE_RANKS).not.toHaveProperty(['user', 'metadata (legacy)'].join('_'));
    expect(SOURCE_RANKS).not.toHaveProperty(['active', 'palette'].join('-'));
  });
});
