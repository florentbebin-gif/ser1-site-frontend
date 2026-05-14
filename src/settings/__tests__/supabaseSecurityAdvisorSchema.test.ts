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
});
