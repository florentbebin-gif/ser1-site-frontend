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

function readMigration(prefix: string): string {
  const file = readdirSync(migrationsDir).find(
    (entry) => entry.startsWith(prefix) && entry.endsWith('.sql'),
  );
  return file ? readFileSync(path.join(migrationsDir, file), 'utf8') : '';
}

describe('advisor securite Supabase', () => {
  it('durcit les fonctions SECURITY DEFINER exposees aux utilisateurs authentifies', () => {
    const sql = readMigrations();

    expect(sql).toMatch(/create\s+schema\s+if\s+not\s+exists\s+private/i);
    expect(sql).toMatch(/drop\s+function\s+if\s+exists\s+public\.get_my_cabinet_id\s*\(\s*\)/i);

    for (const functionName of [
      'ensure_pass_history_current',
      'get_my_cabinet_logo',
      'get_my_cabinet_theme_palette',
    ]) {
      expect(sql).toMatch(
        new RegExp(
          String.raw`create\s+or\s+replace\s+function\s+public\.${functionName}\s*\(\s*\)[\s\S]*security\s+invoker`,
          'i',
        ),
      );
    }

    expect(sql).toMatch(
      /revoke\s+execute\s+on\s+function\s+public\.get_settings_version\s*\(\s*\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i,
    );

    for (const functionName of [
      'set_base_cg_retraite_contract_row_hash',
      'refresh_base_cg_retraite_catalog_meta',
      'refresh_base_cg_retraite_catalog_meta_trigger',
    ]) {
      expect(sql).toMatch(
        new RegExp(
          String.raw`revoke\s+execute\s+on\s+function\s+public\.${functionName}\s*\(\s*\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated`,
          'i',
        ),
      );
    }
  });

  it('reserve la maintenance PASS aux admins cote client', () => {
    const hook = readFileSync(
      path.join(process.cwd(), 'src', 'hooks', 'settings', 'usePassHistory.ts'),
      'utf8',
    );

    expect(hook).toMatch(
      /if\s*\(\s*isAdmin\s*\)\s*{\s*await\s+supabase\.rpc\s*\(\s*['"]ensure_pass_history_current['"]\s*\)/s,
    );
  });

  it('evite les policies permissives multiples sur cabinets et logos', () => {
    const sql = readMigration('20260514000200');

    for (const policyName of [
      '"Admins can manage cabinets"',
      'cabinets_select_own',
      '"Admins can manage logos"',
      'logos_select_own_cabinet',
    ]) {
      expect(sql).toContain(`DROP POLICY IF EXISTS ${policyName}`);
    }

    expect(sql).toMatch(
      /create\s+policy\s+cabinets_select_auth[\s\S]*on\s+public\.cabinets[\s\S]*for\s+select[\s\S]*to\s+authenticated[\s\S]*public\.is_admin\(\)[\s\S]*private\.get_my_cabinet_id\(\)/i,
    );
    expect(sql).toMatch(
      /create\s+policy\s+logos_select_auth[\s\S]*on\s+public\.logos[\s\S]*for\s+select[\s\S]*to\s+authenticated[\s\S]*public\.is_admin\(\)[\s\S]*private\.get_my_cabinet_id\(\)/i,
    );

    for (const table of ['cabinets', 'logos']) {
      for (const action of ['insert', 'update', 'delete']) {
        expect(sql).toMatch(
          new RegExp(
            String.raw`create\s+policy\s+${table}_${action}_admin[\s\S]*for\s+${action}`,
            'i',
          ),
        );
      }
    }
  });
});
