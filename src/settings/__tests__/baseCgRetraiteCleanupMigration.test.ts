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

  it('corrige les documents CG retraite sans retirer le PER Préfon courant', () => {
    const sql = readMigration('20260520000400');

    expect(sql).toContain('ag2r-la-mondiale-madelin-retraite-agricole-373');
    expect(sql).toContain('MADELIN- MONDIALE RETRAITE AGRICOLE');
    expect(sql).toContain('abeille-perin-abeille-retraite-plurielle-394');
    expect(sql).toContain('abeille/perin-abeille-retraite-plurielle/v6369o-06-2025.pdf');
    expect(sql).toContain('V6369O 06/2025');
    expect(sql).toContain('"fraisGestionFondsEuro":0.01');
    expect(sql).toContain('"ageLimiteLiquidation":"80 ans"');
    expect(sql).toContain('ageas-madelin-forticiel');
    expect(sql).toContain('ageas-perp-conditions-generales-forticiel');
    expect(sql).toMatch(/prefon-perp-prefon-retraite-41[\s\S]*is_deleted\s*=\s*true/i);
    expect(sql).not.toContain('prefon-perin-per-prefon-retraite-42');
    expect(sql).not.toContain('prefon/perin-per-prefon-retraite/cg.pdf');

    const retraite94To13Index = sql.indexOf('generali-madelin-la-retraite-13-156');
    const retraite15To94Index = sql.indexOf('generali-madelin-la-retraite-94-153');
    expect(retraite94To13Index).toBeGreaterThanOrEqual(0);
    expect(retraite15To94Index).toBeGreaterThan(retraite94To13Index);
    expect(sql).toContain('generali-madelin-serenidad-retraite-madelin-151');
    expect(sql).toContain('pg_temp.base_cg_retraite_fill_missing');
    expect(sql).toContain('april/madelin-retraite-madelin-april/09-2007.pdf');
    expect(sql).toContain('la-medicale/madelin-medicale-horizon-madelin-2/2007.pdf');
  });
});
