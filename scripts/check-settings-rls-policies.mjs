#!/usr/bin/env node
// Usage: npm run check:settings-rls

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

const TARGETS = {
  tax_settings: {
    read: 'authenticated',
    readMustUseAdmin: false,
    writesMustUseAdmin: true,
  },
  ps_settings: {
    read: 'authenticated',
    readMustUseAdmin: false,
    writesMustUseAdmin: true,
  },
  fiscality_settings: {
    read: 'authenticated',
    readMustUseAdmin: false,
    writesMustUseAdmin: true,
  },
  base_contrat_overrides: {
    read: 'admin',
    readMustUseAdmin: true,
    writesMustUseAdmin: true,
  },
  base_cg_retraite_overrides: {
    read: 'authenticated',
    readMustUseAdmin: false,
    writesMustUseAdmin: true,
  },
  base_cg_retraite_documents: {
    read: 'authenticated',
    readMustUseAdmin: false,
    writesMustUseAdmin: true,
  },
  prevoyance_regime_settings: {
    read: 'authenticated',
    readMustUseAdmin: false,
    writesMustUseAdmin: true,
  },
  prevoyance_maintien_employeur_settings: {
    read: 'authenticated',
    readMustUseAdmin: false,
    writesMustUseAdmin: true,
  },
};

function normalizeSql(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
}

function policyNameFrom(statement) {
  return (
    statement.match(/\bcreate\s+policy\s+"([^"]+)"/i)?.[1] ??
    statement.match(/\bcreate\s+policy\s+([^\s"]+)/i)?.[1] ??
    statement.match(/\bdrop\s+policy\s+if\s+exists\s+"([^"]+)"/i)?.[1] ??
    statement.match(/\bdrop\s+policy\s+if\s+exists\s+([^\s"]+)/i)?.[1] ??
    null
  );
}

function tableRefPattern(table) {
  return new RegExp(
    String.raw`\bon\s+(?:(?:"public"|public)\s*\.\s*)?(?:"${table}"|${table})(?=\s|;|$)`,
    'i',
  );
}

function alterTablePattern(table) {
  return new RegExp(
    String.raw`\balter\s+table\s+(?:(?:"public"|public)\s*\.\s*)?(?:"${table}"|${table})(?=\s|;|$)[\s\S]*\benable\s+row\s+level\s+security\b`,
    'i',
  );
}

function policyCommand(statement) {
  return (
    statement.match(/\bfor\s+(all|select|insert|update|delete)\b/i)?.[1].toLowerCase() ?? 'all'
  );
}

function policyRole(statement) {
  return (
    statement.match(/\bto\s+(authenticated|anon|public|service_role)\b/i)?.[1].toLowerCase() ??
    'public'
  );
}

function usesAdminGuard(statement) {
  return /\bpublic\.is_admin\s*\(/i.test(statement);
}

function collectStatements(file) {
  const fullPath = path.join(MIGRATIONS_DIR, file);
  const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/);
  const statements = [];
  let current = [];
  let startLine = 1;

  for (const [index, line] of lines.entries()) {
    if (current.length === 0 && !line.trim()) {
      continue;
    }
    if (current.length === 0) {
      startLine = index + 1;
    }
    current.push(line);
    if (line.includes(';')) {
      const raw = current.join('\n');
      const sql = normalizeSql(raw);
      if (sql) statements.push({ file, line: startLine, sql });
      current = [];
    }
  }

  const trailing = normalizeSql(current.join('\n'));
  if (trailing) statements.push({ file, line: startLine, sql: trailing });
  return statements;
}

function collectMigrationState() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const state = Object.fromEntries(
    Object.keys(TARGETS).map((table) => [table, { rlsEnabled: false, policies: new Map() }]),
  );

  for (const file of files) {
    for (const statement of collectStatements(file)) {
      for (const table of Object.keys(TARGETS)) {
        if (alterTablePattern(table).test(statement.sql)) {
          state[table].rlsEnabled = true;
          state[table].rlsEvidence = { file: statement.file, line: statement.line };
        }

        if (!tableRefPattern(table).test(statement.sql)) continue;

        if (/\bdrop\s+policy\s+if\s+exists\b/i.test(statement.sql)) {
          const name = policyNameFrom(statement.sql);
          if (name) state[table].policies.delete(name);
          continue;
        }

        if (/\bcreate\s+policy\b/i.test(statement.sql)) {
          const name = policyNameFrom(statement.sql);
          if (!name) continue;

          state[table].policies.set(name, {
            policy: name,
            command: policyCommand(statement.sql),
            role: policyRole(statement.sql),
            usesAdmin: usesAdminGuard(statement.sql),
            file: statement.file,
            line: statement.line,
          });
        }
      }
    }
  }

  return state;
}

function commandMatches(policy, expected) {
  return policy.command === expected || policy.command === 'all';
}

function roleAllowsAuthenticated(policy) {
  return policy.role === 'authenticated' || policy.role === 'public';
}

function summarizeTable(table, target, tableState) {
  const policies = [...tableState.policies.values()];
  const readPolicies = policies.filter((policy) => commandMatches(policy, 'select'));
  const writePolicies = {
    insert: policies.filter((policy) => commandMatches(policy, 'insert')),
    update: policies.filter((policy) => commandMatches(policy, 'update')),
    delete: policies.filter((policy) => commandMatches(policy, 'delete')),
  };

  const expectedRead = readPolicies.some(
    (policy) =>
      roleAllowsAuthenticated(policy) &&
      (target.readMustUseAdmin ? policy.usesAdmin : !policy.usesAdmin),
  );

  const expectedWrites = Object.values(writePolicies).every((candidates) =>
    candidates.some(
      (policy) =>
        roleAllowsAuthenticated(policy) && (!target.writesMustUseAdmin || policy.usesAdmin),
    ),
  );

  const evidence = [
    tableState.rlsEvidence && {
      policy: 'ENABLE ROW LEVEL SECURITY',
      ...tableState.rlsEvidence,
    },
    ...policies
      .filter(
        (policy) =>
          commandMatches(policy, 'select') ||
          commandMatches(policy, 'insert') ||
          commandMatches(policy, 'update') ||
          commandMatches(policy, 'delete'),
      )
      .map(({ policy, file, line }) => ({ policy, file, line })),
  ].filter(Boolean);

  const failures = [];
  if (!tableState.rlsEnabled) failures.push(`${table}: RLS non activee dans les migrations`);
  if (!expectedRead) failures.push(`${table}: policy de lecture attendue absente (${target.read})`);
  if (!expectedWrites) failures.push(`${table}: policies insert/update/delete admin absentes`);

  return {
    table,
    rlsEnabled: tableState.rlsEnabled,
    expectedRead,
    expectedWrites,
    evidence,
    failures,
  };
}

function buildReport() {
  const migrationState = collectMigrationState();
  const tables = {};
  const failures = [];

  for (const [table, target] of Object.entries(TARGETS)) {
    const summary = summarizeTable(table, target, migrationState[table]);
    tables[table] = summary;
    failures.push(...summary.failures);
  }

  return {
    ok: failures.length === 0,
    tables,
    failures,
  };
}

const report = buildReport();

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else if (report.ok) {
  console.log('check:settings-rls ✅');
  for (const table of Object.values(report.tables)) {
    console.log(`- ${table.table}: RLS active, lecture attendue, écritures admin`);
  }
} else {
  console.error('check:settings-rls ❌');
  for (const failure of report.failures) {
    console.error(`- ${failure}`);
  }
}

if (!report.ok) {
  process.exit(1);
}
