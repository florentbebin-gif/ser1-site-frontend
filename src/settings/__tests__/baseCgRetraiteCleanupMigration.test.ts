import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

function readMigration(prefix: string): string {
  const file = readdirSync(migrationsDir).find(
    (entry) => entry.startsWith(prefix) && entry.endsWith('.sql'),
  );
  return file ? readFileSync(path.join(migrationsDir, file), 'utf8') : '';
}

describe('migration nettoyage Base CG retraite', () => {
  it('normalise les overrides sans suppression physique ni blobs orphelins', () => {
    const sql = readMigration('20260520000100');

    expect(sql).toContain('Rollback');
    expect(sql).toContain('primonial-madelin-gestion-privee-promadelin-35');
    expect(sql).toContain(
      'primonial-madelin-cardif-retraite-professionnels-patrimoine-management-et-associes-36',
    );
    expect(sql).toMatch(/is_deleted\s*=\s*true/i);
    expect(sql).toMatch(/CREDIT_DU_NORD[\s\S]*SOCIETE_GENERALE/i);
    expect(sql).toMatch(/primonial-perin-primoper-37[\s\S]*ORADEA/i);
    expect(sql).toMatch(/jsonb_set/i);
    expect(sql).toMatch(/where[\s\S]*contract_data\s*->>\s*'compagnie'/i);
    expect(sql).not.toMatch(/delete\s+from\s+public\.base_cg_retraite_documents/i);
    expect(sql).not.toMatch(/delete\s+from\s+storage\.objects/i);
  });
});
