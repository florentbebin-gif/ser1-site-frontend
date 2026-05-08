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

describe('statut de revue des overrides Base-Contrat', () => {
  it('ajoute un enum strict et les champs de pilotage de revue', () => {
    const sql = readMigrations();

    expect(sql).toMatch(/create\s+type\s+public\.base_contrat_review_status\s+as\s+enum\s*\(\s*'ok'\s*,\s*'a_revoir'\s*,\s*'obsolescence_a_confirmer'\s*\)/i);
    expect(sql).toMatch(/alter\s+table\s+public\.base_contrat_overrides[\s\S]*add\s+column\s+if\s+not\s+exists\s+review_status\s+public\.base_contrat_review_status/i);
    expect(sql).toMatch(/alter\s+table\s+public\.base_contrat_overrides[\s\S]*alter\s+column\s+review_status\s+set\s+default\s+'ok'/i);
    expect(sql).toMatch(/alter\s+table\s+public\.base_contrat_overrides[\s\S]*alter\s+column\s+review_status\s+set\s+not\s+null/i);
    expect(sql).toMatch(/alter\s+table\s+public\.base_contrat_overrides[\s\S]*add\s+column\s+if\s+not\s+exists\s+review_reason\s+text/i);
    expect(sql).toMatch(/alter\s+table\s+public\.base_contrat_overrides[\s\S]*add\s+column\s+if\s+not\s+exists\s+next_review_at\s+date/i);
  });
});
